/**
 * Billing & Subscription Types
 * 
 * Type definitions for Stripe billing integration.
 * Aligns with the backend's billing API endpoints.
 */

/**
 * Subscription status from Stripe
 */
export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'inactive'; // For FREE plan (no Stripe subscription)

/**
 * Plan key matching backend
 */
export type BillingPlanKey = 'FREE' | 'PREMIUM';

/**
 * Billing status response from GET /api/v1/billing/status
 */
export interface BillingStatus {
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null; // ISO 8601 date string
  cancelAtPeriodEnd: boolean;
}

/**
 * Checkout session response from POST /api/v1/billing/checkout-session
 */
export interface CheckoutSessionResponse {
  url: string; // Stripe Checkout URL
}

/**
 * Portal session response from POST /api/v1/billing/portal-session
 */
export interface PortalSessionResponse {
  url: string; // Stripe Customer Portal URL
}

/**
 * Backend API response wrapper
 */
export interface BillingApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Request body for creating checkout session
 */
export interface CreateCheckoutSessionRequest {
  plan: 'PREMIUM';
}

/**
 * Typed API responses
 */
export type BillingStatusApiResponse = BillingApiResponse<BillingStatus>;
export type CheckoutSessionApiResponse = BillingApiResponse<CheckoutSessionResponse>;
export type PortalSessionApiResponse = BillingApiResponse<PortalSessionResponse>;

