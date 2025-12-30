/* =============================== PLAN TYPES =============================== */

export type PlanKey = "FREE" | "PAID" | "INTERNAL";

export interface PlanConfig {
  key: PlanKey;
  monthlyLimit: number;
  name: string;
  description: string;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  FREE: {
    key: "FREE",
    monthlyLimit: 10,
    name: "Free Plan",
    description: "Default plan for new users",
  },
  PAID: {
    key: "PAID",
    monthlyLimit: 50,
    name: "Paid Plan",
    description: "Premium plan via Stripe",
  },
  INTERNAL: {
    key: "INTERNAL",
    monthlyLimit: 1000,
    name: "Internal Plan",
    description: "Internal/admin users",
  },
} as const;

/* =========================== SUBSCRIPTION TYPES =========================== */

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled";

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/* =========================== USAGE COUNTER TYPES ========================== */

export interface UsageCounter {
  id: string;
  userId: string;
  periodKey: string; // Format: YYYY-MM-DD (billing period start date)
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

/* =========================== USER METADATA TYPES ========================== */

export interface UserMetadata {
  planOverride?: PlanKey | null;
  monthlyLimitOverride?: number | null;
}

/* ========================== SERVICES RESULT TYPES ========================= */

export type EntitlementSource =
  | "user_override"
  | "subscription_active"
  | "subscription_inactive"
  | "default_free";

export interface EntitlementResult {
  planKey: PlanKey;
  monthlyLimit: number;
  source: EntitlementSource;
}

export interface UsageSnapshotResult {
  planKey: PlanKey;
  monthlyLimit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
  source: EntitlementSource;
}

export interface ConsumeUsageResult {
  used: number;
  remaining: number;
  planKey: PlanKey;
  monthlyLimit: number;
  periodKey: string;
}

export interface ConsumeUsageMeta {
  conversationId?: string;
  model?: string;
  tokensEstimate?: number;
}

/* ============================ PERIOD UTILITIES ============================ */

export interface PeriodInfo {
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Get period info for a given date based on user's billing cycle anchor
 */
export function getPeriodInfo(
  userCreatedAt: Date,
  dateNow: Date = new Date()
): PeriodInfo {
  // 1. Normalize dates to UTC midnight for consistent calculations
  const anchor = new Date(
    Date.UTC(
      userCreatedAt.getUTCFullYear(),
      userCreatedAt.getUTCMonth(),
      userCreatedAt.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  const now = new Date(
    Date.UTC(
      dateNow.getUTCFullYear(),
      dateNow.getUTCMonth(),
      dateNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  // 2. Calculate how many months have passed since the anchor date
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth();
  const anchorDay = anchor.getUTCDate();

  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  const nowDay = now.getUTCDate();

  // 3. Calculate total months difference
  let monthsPassed = (nowYear - anchorYear) * 12 + (nowMonth - anchorMonth);

  // 4. If we haven't reached the anchor day in the current month, we're still in the previous period
  if (nowDay < anchorDay) {
    monthsPassed--;
  }

  // 5. Calculate period start (anchor + monthsPassed months)
  const periodStart = new Date(
    Date.UTC(anchorYear, anchorMonth + monthsPassed, anchorDay, 0, 0, 0, 0)
  );

  // 6. Calculate period end (anchor + (monthsPassed + 1) months)
  const periodEnd = new Date(
    Date.UTC(anchorYear, anchorMonth + monthsPassed + 1, anchorDay, 0, 0, 0, 0)
  );

  // 7. Format period key as YYYY-MM-DD (using period start date)
  const periodKey = `${periodStart.getUTCFullYear()}-${String(
    periodStart.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(periodStart.getUTCDate()).padStart(2, "0")}`;

  return {
    periodKey,
    periodStart,
    periodEnd,
  };
}
