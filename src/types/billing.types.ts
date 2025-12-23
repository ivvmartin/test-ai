export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "inactive"; // For FREE plan (no Stripe subscription)

export type BillingPlanKey = "FREE" | "PREMIUM";

export interface BillingStatus {
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

export interface CreateCheckoutSessionRequest {
  plan: "PREMIUM";
}

export type BillingStatusApiResponse = BillingApiResponse<BillingStatus>;
export type CheckoutSessionApiResponse =
  BillingApiResponse<CheckoutSessionResponse>;
export type PortalSessionApiResponse =
  BillingApiResponse<PortalSessionResponse>;
