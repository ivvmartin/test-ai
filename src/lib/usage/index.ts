/**
 * Usage & Limits System
 * 
 * Public exports for the usage tracking and enforcement system.
 */

export { usageService, UsageService } from './service';
export { LimitExceededError, UsageError, isUsageError } from './errors';
export type {
  PlanKey,
  PlanConfig,
  Subscription,
  SubscriptionStatus,
  SubscriptionProvider,
  UsageCounter,
  UserMetadata,
  EntitlementResult,
  EntitlementSource,
  UsageSnapshotResult,
  ConsumeUsageResult,
  ConsumeUsageMeta,
  PeriodInfo,
} from './types';
export { PLANS, getPeriodInfo } from './types';

