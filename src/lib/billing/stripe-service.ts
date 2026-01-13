import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import {
  BillingError,
  StripeConfigError,
  WebhookVerificationError,
} from "./errors";
import type { CheckoutSessionResponse, PortalSessionResponse } from "./types";

/**
 * Stripe Service
 *
 * Provides methods for:
 * - Creating checkout sessions
 * - Creating customer portal sessions
 * - Verifying webhook signatures
 * - Processing webhook events
 */
export class StripeBillingService {
  private stripe: Stripe;

  constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new StripeConfigError(
        "STRIPE_SECRET_KEY is not configured. Please set it in your environment variables."
      );
    }

    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }

  /**
   * Create Checkout Session
   *
   * Creates a Stripe Checkout Session for upgrading to PREMIUM plan
   */
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    existingCustomerId?: string | null
  ): Promise<CheckoutSessionResponse> {
    if (!env.STRIPE_PREMIUM_PRICE_ID) {
      throw new StripeConfigError(
        "STRIPE_PREMIUM_PRICE_ID is not configured. Please set it in your environment variables."
      );
    }

    const successUrl = `${env.NEXT_PUBLIC_SITE_URL}${env.BILLING_CHECKOUT_SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${env.NEXT_PUBLIC_SITE_URL}${env.BILLING_CHECKOUT_CANCEL_PATH}`;

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: env.STRIPE_PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      };

      // Create customer first if needed (required for preferred_locales per Stripe docs)
      // See: https://docs.stripe.com/api/customers/create?api-version=2025-12-15.preview&rds=1
      let customerId = existingCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: userEmail,
          preferred_locales: ["bg"],
          metadata: { userId },
        });
        customerId = customer.id;
      }

      sessionParams.customer = customerId;
      sessionParams.billing_address_collection = "required";
      sessionParams.customer_update = {
        address: "auto",
        name: "auto",
      };

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new BillingError("Failed to create checkout session URL");
      }

      return { url: session.url };
    } catch (error) {
      if (error instanceof BillingError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BillingError(`Failed to create checkout session: ${message}`);
    }
  }

  /**
   * Create Customer Portal Session
   *
   * Creates a Stripe Customer Portal Session for managing subscription
   *
   */
  async createPortalSession(
    stripeCustomerId: string
  ): Promise<PortalSessionResponse> {
    const returnUrl = `${env.NEXT_PUBLIC_SITE_URL}${env.BILLING_PORTAL_RETURN_PATH}`;

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BillingError(`Failed to create portal session: ${message}`);
    }
  }

  /**
   * Cancel Subscription
   *
   * Cancels a Stripe subscription immediately
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BillingError(`Failed to cancel subscription: ${message}`);
    }
  }

  /**
   * Retrieve Subscription
   *
   * Retrieves a Stripe subscription by ID
   */
  async retrieveSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new BillingError(`Failed to retrieve subscription: ${message}`);
    }
  }

  /**
   * Verify Webhook Signature
   *
   * Verifies that a webhook event came from Stripe
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new StripeConfigError(
        "STRIPE_WEBHOOK_SECRET is not configured. Please set it in your environment variables."
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid signature";
      throw new WebhookVerificationError(
        `Webhook signature verification failed: ${message}`
      );
    }
  }
}
