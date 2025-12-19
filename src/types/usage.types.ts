/**
 * Usage & Limits Types
 *
 * Type definitions for the backend usage tracking system.
 * Aligns with the backend's UsageDTO and error contracts.
 */

export type PlanKey = "FREE" | "PAID" | "INTERNAL";

export type SubscriptionSource =
  | "user_override"
  | "subscription_active"
  | "subscription_inactive"
  | "default_free";

/**
 * Complete usage snapshot for the current billing period
 */
export interface UsageSnapshot {
  planKey: PlanKey;
  monthlyLimit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  periodKey: string; // YYYY-MM format
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
  FREE: {
    key: "FREE",
    name: "Free",
    color: "text-gray-600",
    badgeVariant: "outline",
  },
  PAID: {
    key: "PAID",
    name: "Pro",
    color: "#21355a",
    badgeVariant: "default",
  },
  INTERNAL: {
    key: "INTERNAL",
    name: "Internal",
    color: "text-purple-600",
    badgeVariant: "secondary",
  },
} as const;
