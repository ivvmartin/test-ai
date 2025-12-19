/**
 * Usage & Limits System - Type Definitions
 */

// ============================================================================
// PLAN TYPES
// ============================================================================

export type PlanKey = 'FREE' | 'PAID' | 'INTERNAL';

export interface PlanConfig {
  key: PlanKey;
  monthlyLimit: number;
  name: string;
  description: string;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  FREE: {
    key: 'FREE',
    monthlyLimit: 10,
    name: 'Free Plan',
    description: 'Default plan for new users',
  },
  PAID: {
    key: 'PAID',
    monthlyLimit: 50,
    name: 'Paid Plan',
    description: 'Premium plan via Stripe',
  },
  INTERNAL: {
    key: 'INTERNAL',
    monthlyLimit: 1000,
    name: 'Internal Plan',
    description: 'Internal/admin users',
  },
} as const;

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled';
export type SubscriptionProvider = 'none' | 'stripe';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  currentPeriodEnd: Date | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USAGE COUNTER TYPES
// ============================================================================

export interface UsageCounter {
  id: string;
  userId: string;
  periodKey: string; // Format: YYYY-MM
  used: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER METADATA TYPES
// ============================================================================

export interface UserMetadata {
  planOverride?: PlanKey | null;
  monthlyLimitOverride?: number | null;
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export type EntitlementSource = 
  | 'user_override' 
  | 'subscription_active' 
  | 'subscription_inactive' 
  | 'default_free';

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

// ============================================================================
// METADATA FOR FUTURE AI INTEGRATION
// ============================================================================

export interface ConsumeUsageMeta {
  conversationId?: string;
  model?: string;
  tokensEstimate?: number;
}

// ============================================================================
// PERIOD UTILITIES
// ============================================================================

export interface PeriodInfo {
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Get period info for a given date (defaults to now)
 */
export function getPeriodInfo(dateNow: Date = new Date()): PeriodInfo {
  const year = dateNow.getUTCFullYear();
  const month = dateNow.getUTCMonth(); // 0-11
  
  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  
  return {
    periodKey,
    periodStart,
    periodEnd,
  };
}

