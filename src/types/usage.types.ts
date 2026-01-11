export type PlanKey = "TRIAL" | "PAID" | "FREE_INTERNAL" | "INTERNAL";

export type SubscriptionSource =
  | "user_override"
  | "subscription_active"
  | "subscription_inactive"
  | "default_free";

export interface UsageSnapshot {
  planKey: PlanKey;
  monthlyLimit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  periodKey: string; // YYYY-MM-DD format (billing period start date)
  periodStart: string; // ISO 8601 date string
  periodEnd: string; // ISO 8601 date string
  source: SubscriptionSource;
}

/**
 * Backend API response wrapper
 */
export interface UsageApiResponse {
  success: true;
  data: UsageSnapshot;
}

/**
 * Limit exceeded error from backend (HTTP 429)
 */
export interface LimitExceededError {
  success: false;
  error: {
    message: string;
    code: "LIMIT_EXCEEDED";
  };
}

/**
 * Generic usage error
 */
export interface UsageError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Plan metadata for display purposes
 */
export interface PlanMetadata {
  key: PlanKey;
  name: string;
  monthlyLimit: number;
  color: string; // Tailwind color class
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

export const PLAN_METADATA: Record<
  PlanKey,
  Omit<PlanMetadata, "monthlyLimit">
> = {
  TRIAL: {
    key: "TRIAL",
    name: "Пробен",
    color: "text-blue-600",
    badgeVariant: "outline",
  },
  PAID: {
    key: "PAID",
    name: "Premium",
    color: "#21355a",
    badgeVariant: "default",
  },
  FREE_INTERNAL: {
    key: "FREE_INTERNAL",
    name: "Безплатен",
    color: "text-green-600",
    badgeVariant: "outline",
  },
  INTERNAL: {
    key: "INTERNAL",
    name: "Служебен",
    color: "text-purple-600",
    badgeVariant: "secondary",
  },
} as const;
