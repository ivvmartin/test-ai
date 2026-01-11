export type PlanKey = "TRIAL" | "PAID" | "FREE_INTERNAL" | "INTERNAL";

export interface PlanConfig {
  key: PlanKey;
  monthlyLimit: number;
  name: string;
  description: string;
  isTrialPlan?: boolean; // True for TRIAL plan (7-day period, no monthly reset)
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  TRIAL: {
    key: "TRIAL",
    monthlyLimit: 15,
    name: "Trial Plan",
    description: "7-day trial for new users (15 messages total)",
    isTrialPlan: true,
  },
  PAID: {
    key: "PAID",
    monthlyLimit: 50,
    name: "Paid Plan",
    description: "Premium plan via Stripe",
  },
  FREE_INTERNAL: {
    key: "FREE_INTERNAL",
    monthlyLimit: 25,
    name: "Free Internal Plan",
    description: "Internal free plan (25 messages per month)",
  },
  INTERNAL: {
    key: "INTERNAL",
    monthlyLimit: 1000,
    name: "Internal Plan",
    description: "Internal/admin users",
  },
} as const;

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

export interface UsageCounter {
  id: string;
  userId: string;
  periodKey: string; // Format: YYYY-MM-DD (billing period start date)
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMetadata {
  planOverride?: PlanKey | null;
  monthlyLimitOverride?: number | null;
}

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
  chatId?: string;
  model?: string;
  tokensEstimate?: number;
}
export interface PeriodInfo {
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Get trial period info (7 days from user creation, no monthly reset)
 */
export function getTrialPeriodInfo(userCreatedAt: Date): PeriodInfo {
  // 1. Normalize user creation date to UTC midnight
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

  // 2. Trial period is exactly 7 days from creation
  const periodStart = anchor;
  const periodEnd = new Date(anchor.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

  // 3. Format period key as YYYY-MM-DD (using period start date)
  const periodKey = `${periodStart.getUTCFullYear()}-${String(
    periodStart.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(periodStart.getUTCDate()).padStart(2, "0")}`;

  return {
    periodKey,
    periodStart,
    periodEnd,
  };
}

/**
 * Get period info for a given date based on user's billing cycle anchor
 * (for monthly plans like PAID, FREE_INTERNAL, INTERNAL)
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
