export type PlanKey = "TRIAL" | "PAID" | "FREE_INTERNAL" | "INTERNAL";

export interface BillingPlan {
  plan: PlanKey;
  monthlyLimit: number;
  balance: number; // Remaining messages
  periodStart: string; // ISO 8601 date string
  periodEnd: string; // ISO 8601 date string
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

export type BillingPlanApiResponse = BillingApiResponse<BillingPlan>;
export type CheckoutSessionApiResponse =
  BillingApiResponse<CheckoutSessionResponse>;
export type PortalSessionApiResponse =
  BillingApiResponse<PortalSessionResponse>;
