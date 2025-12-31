/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POST /api/billing/webhook
 *
 * Receives and processes Stripe webhook events
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { StripeBillingService, WebhookVerificationError } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Stripe webhooks are server-to-server and don't require CORS.
 * Webhook authenticity is verified via Stripe signature validation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // 1. Verify webhook signature
    const stripeService = new StripeBillingService();
    let event: Stripe.Event;

    try {
      event = stripeService.verifyWebhookSignature(body, signature);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error("Webhook verification failed:", error.message);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
      throw error;
    }

    // 2. Check for duplicate events (idempotency)
    const adminClient = createAdminClient();
    const { data: existingEvent } = await adminClient
      .from("stripe_events")
      .select("id")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      return NextResponse.json({ received: true });
    }

    // 3. Process event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 4. Record event as processed
    await adminClient.from("stripe_events").insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  if (session.subscription && typeof session.subscription === "string") {
    // Use StripeBillingService to ensure validated env usage
    const stripeService = new StripeBillingService();
    const stripe = (stripeService as any).stripe;

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    await upsertSubscription(userId, subscription);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  await upsertSubscription(userId, subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const adminClient = createAdminClient();
  await adminClient.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_key: "FREE",
      status: "inactive",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceWithSub = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription;
  };
  const subscriptionId =
    typeof invoiceWithSub.subscription === "string"
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const adminClient = createAdminClient();
  const { data: existingSubscription } = await adminClient
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (existingSubscription) {
    await adminClient
      .from("subscriptions")
      .update({ status: "active" })
      .eq("stripe_subscription_id", subscriptionId);
  } else {
    const stripeService = new StripeBillingService();
    const stripe = (stripeService as any).stripe;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (userId) {
      await upsertSubscription(userId, subscription);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceWithSub = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription;
  };
  const subscriptionId =
    typeof invoiceWithSub.subscription === "string"
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const adminClient = createAdminClient();
  await adminClient
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);
}

async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const adminClient = createAdminClient();

  let currentPeriodEnd: string | null = null;
  if ("current_period_end" in subscription && subscription.current_period_end) {
    const periodEnd = subscription.current_period_end as number;
    currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
  } else if (subscription.status === "trialing" && subscription.trial_end) {
    currentPeriodEnd = new Date(subscription.trial_end * 1000).toISOString();
  } else {
    // Fallback: try subscription items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = subscription.items.data[0];
    if (item && "current_period_end" in item) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemPeriodEnd = (item as any).current_period_end;
      if (itemPeriodEnd) {
        currentPeriodEnd = new Date(itemPeriodEnd * 1000).toISOString();
      }
    }
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const planKey =
    subscription.status === "active" || subscription.status === "trialing"
      ? "PREMIUM"
      : "FREE";

  await adminClient.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_key: planKey,
      status: subscription.status as any,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id || null,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id", ignoreDuplicates: false }
  );
}
