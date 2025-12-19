/**
 * Billing System - Type Definitions
 */

// ============================================================================
// PLAN TYPES
// ============================================================================

export type BillingPlanKey = 'FREE' | 'PREMIUM';

export interface BillingPlanConfig {
  key: BillingPlanKey;
  name: string;
  description: string;
  stripePriceId: string | null; // null for FREE plan
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionStatus = 
  | 'inactive'    // FREE plan (no Stripe subscription)
  | 'active'      // Active paid subscription
  | 'trialing'    // In trial period
  | 'past_due'    // Payment failed
  | 'canceled'    // Canceled but still active until period end
  | 'unpaid'      // Payment failed and grace period expired
  | 'incomplete'  // Initial payment incomplete
  | 'incomplete_expired'; // Initial payment incomplete and expired

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  provider: 'none' | 'stripe';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// STRIPE EVENT TYPES
// ============================================================================

export interface StripeEventRecord {
  id: string;
  eventId: string;      // Stripe event ID (evt_xxx)
  eventType: string;    // Event type (e.g., customer.subscription.updated)
  processedAt: Date;
  createdAt: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface BillingStatusResponse {
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null; // ISO 8601 date string
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionResponse {
  url: string; // Stripe Checkout URL
}

export interface PortalSessionResponse {
  url: string; // Stripe Customer Portal URL
}

export interface BillingApiResponse<T> {
  success: true;
  data: T;
}

export interface BillingApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateCheckoutSessionRequest {
  plan: 'PREMIUM';
}

