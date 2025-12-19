/**
 * Usage & Limits System - Service Layer
 *
 * Provides production-grade usage tracking and enforcement.
 * Uses Supabase for storage with atomic operations.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PlanKey,
  PLANS,
  EntitlementResult,
  UsageSnapshotResult,
  ConsumeUsageResult,
  ConsumeUsageMeta,
  getPeriodInfo,
  Subscription,
  UsageCounter,
  UserMetadata,
} from "./types";
import { LimitExceededError, UsageError } from "./errors";

/**
 * Usage Service
 *
 * Stable API contract for usage tracking and enforcement.
 */
export class UsageService {
  private supabase = createAdminClient();

  /**
   * Resolve Entitlement
   *
   * Determines the effective plan and monthly limit for a user.
   *
   * Priority order:
   * 1. User-level override (planOverride + optional monthlyLimitOverride)
   * 2. Active subscription (checks subscription.status === 'active')
   * 3. Default FREE plan
   */
  async resolveEntitlement(userId: string): Promise<EntitlementResult> {
    // 1. Check for user-level override in user metadata
    const { data: user, error: userError } =
      await this.supabase.auth.admin.getUserById(userId);

    if (userError) {
      throw new UsageError(`Failed to fetch user: ${userError.message}`);
    }

    const metadata = (user.user.user_metadata || {}) as UserMetadata;

    if (metadata.planOverride) {
      const planKey = metadata.planOverride as PlanKey;
      const monthlyLimit =
        metadata.monthlyLimitOverride ?? PLANS[planKey].monthlyLimit;

      return {
        planKey,
        monthlyLimit,
        source: "user_override",
      };
    }

    // 2. Check for active subscription (PREMIUM plan)
    const { data: subscription, error: subError } = await this.supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Accept both 'active' and 'trialing' status for PREMIUM plan
    if (
      !subError &&
      subscription &&
      subscription.plan_key === "PREMIUM" &&
      (subscription.status === "active" || subscription.status === "trialing")
    ) {
      return {
        planKey: "PAID",
        monthlyLimit: PLANS.PAID.monthlyLimit,
        source: "subscription_active",
      };
    }

    // 3. Default to FREE plan
    return {
      planKey: "FREE",
      monthlyLimit: PLANS.FREE.monthlyLimit,
      source: "default_free",
    };
  }

  /**
   * Get Usage Snapshot
   *
   * Returns complete usage information for a user in the current period.
   */
  async getUsageSnapshot(
    userId: string,
    dateNow: Date = new Date()
  ): Promise<UsageSnapshotResult> {
    const entitlement = await this.resolveEntitlement(userId);
    const period = getPeriodInfo(dateNow);

    // Get current usage for this period
    const { data: counter, error } = await this.supabase
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("period_key", period.periodKey)
      .single();

    const used = counter?.used ?? 0;
    const remaining = Math.max(0, entitlement.monthlyLimit - used);
    const percentUsed =
      entitlement.monthlyLimit > 0
        ? Math.round((used / entitlement.monthlyLimit) * 100)
        : 0;

    return {
      planKey: entitlement.planKey,
      monthlyLimit: entitlement.monthlyLimit,
      used,
      remaining,
      percentUsed,
      periodKey: period.periodKey,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      source: entitlement.source,
    };
  }

  /**
   * Consume Usage
   *
   * Atomically consumes usage units for a user.
   *
   * Guarantees:
   * - Atomic increment (no race conditions)
   * - Limit enforcement (throws LimitExceededError if exceeded)
   * - Automatic period creation (no manual setup needed)
   *
   * @throws {LimitExceededError} If monthly limit would be exceeded
   */
  async consumeUsage(
    userId: string,
    amount: number = 1,
    meta?: ConsumeUsageMeta
  ): Promise<ConsumeUsageResult> {
    const entitlement = await this.resolveEntitlement(userId);
    const period = getPeriodInfo();

    // Use the atomic consume_usage function
    const { data, error } = await this.supabase.rpc("consume_usage", {
      p_user_id: userId,
      p_period_key: period.periodKey,
      p_amount: amount,
      p_limit: entitlement.monthlyLimit,
    });

    if (error) {
      throw new UsageError(`Failed to consume usage: ${error.message}`);
    }

    // If data is null, limit was exceeded
    if (!data) {
      // Get current usage to provide accurate error message
      const snapshot = await this.getUsageSnapshot(userId);
      throw new LimitExceededError(
        LimitExceededError.createMessage(
          snapshot.used,
          snapshot.monthlyLimit,
          snapshot.planKey
        ),
        snapshot.used,
        snapshot.monthlyLimit,
        snapshot.planKey
      );
    }

    const counter = data as unknown as UsageCounter;
    const remaining = Math.max(0, entitlement.monthlyLimit - counter.used);

    return {
      used: counter.used,
      remaining,
      planKey: entitlement.planKey,
      monthlyLimit: entitlement.monthlyLimit,
      periodKey: period.periodKey,
    };
  }

  /**
   * Assert Within Limit
   *
   * Convenience method that throws if the user has exceeded their limit.
   * Useful for checking limits before performing expensive operations.
   *
   * @throws {LimitExceededError} If monthly limit is already exceeded
   */
  async assertWithinLimit(userId: string): Promise<void> {
    const snapshot = await this.getUsageSnapshot(userId);

    if (snapshot.used >= snapshot.monthlyLimit) {
      throw new LimitExceededError(
        LimitExceededError.createMessage(
          snapshot.used,
          snapshot.monthlyLimit,
          snapshot.planKey
        ),
        snapshot.used,
        snapshot.monthlyLimit,
        snapshot.planKey
      );
    }
  }
}

// Singleton instance
export const usageService = new UsageService();
