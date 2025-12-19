/**
 * POST /api/billing/webhook
 *
 * Receives and processes Stripe webhook events.
 *
 * Authentication: None (signature-verified)
 * Headers: stripe-signature
 * Body: Raw Stripe event payload
 *
 * Handles:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { StripeBillingService, WebhookVerificationError } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
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

    // 3. Check for duplicate events (idempotency)
    const adminClient = createAdminClient();
    const { data: existingEvent } = await adminClient
      .from("stripe_events")
      .select("id")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true });
    }

    // 4. Process event based on type
    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
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

    // 5. Record event as processed
    await adminClient.from("stripe_events").insert({
      event_id: event.id,
      event_type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Creates/updates subscription with PREMIUM plan
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  const adminClient = createAdminClient();

  // Fetch full subscription details from Stripe
  if (session.subscription && typeof session.subscription === "string") {
    const stripe = new (await import("stripe")).default(
      process.env.STRIPE_SECRET_KEY!,
      {
        apiVersion: "2025-12-15.clover",
      }
    );

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    await upsertSubscription(userId, subscription);
  }
}

/**
 * Handle customer.subscription.created/updated
 * Updates subscription record with latest Stripe data
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  await upsertSubscription(userId, subscription);
}

/**
 * Handle customer.subscription.deleted
 * Reverts user to FREE plan
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("subscriptions").upsert({
    user_id: userId,
    plan_key: "FREE",
    status: "inactive",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    current_period_end: null,
    cancel_at_period_end: false,
    provider: "none",
  });

  if (error) {
    console.error(`Failed to delete subscription for user ${userId}:`, error);
    throw error;
  }

  console.log(`Subscription deleted for user ${userId}, reverted to FREE plan`);
}

/**
 * Handle invoice.payment_succeeded
 * Ensures subscription status is active
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Type assertion needed due to Stripe SDK type definitions
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

  const { error } = await adminClient
    .from("subscriptions")
    .update({ status: "active" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error(`Failed to update subscription ${subscriptionId}:`, error);
    throw error;
  }

  console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

/**
 * Handle invoice.payment_failed
 * Sets subscription status to past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Type assertion needed due to Stripe SDK type definitions
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

  const { error } = await adminClient
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error(`Failed to update subscription ${subscriptionId}:`, error);
    throw error;
  }

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

/**
 * Upsert subscription record from Stripe subscription object
 *
 * Note: Stripe API 2025-03-31.basil+ deprecated subscription-level current_period_end.
 * We calculate it from trial_end (for trialing) or set to null (will be updated from invoices).
 */
async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const adminClient = createAdminClient();

  const priceId = subscription.items.data[0]?.price.id || null;

  // Calculate period end: use trial_end for trialing subscriptions, otherwise null
  // (will be updated when invoice.payment_succeeded webhook fires)
  let currentPeriodEnd: string | null = null;
  if (subscription.status === "trialing" && subscription.trial_end) {
    currentPeriodEnd = new Date(subscription.trial_end * 1000).toISOString();
  }

  const { data, error } = await adminClient.from("subscriptions").upsert({
    user_id: userId,
    plan_key: "PREMIUM",
    status: subscription.status as any,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    provider: "stripe",
  });

  if (error) {
    console.error(`Failed to upsert subscription for user ${userId}:`, error);
    throw error;
  }

  console.log(
    `Subscription upserted for user ${userId}: ${subscription.status}`
  );
}
