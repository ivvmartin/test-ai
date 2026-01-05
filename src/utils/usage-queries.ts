/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import apiClient from "@/lib/axios";
import type { PlanKey, UsageSnapshot } from "../types/usage.types";

/**
 * Query key factory for usage-related queries
 */
export const usageKeys = {
  all: ["usage"] as const,
  snapshot: () => [...usageKeys.all, "snapshot"] as const,
  me: () => [...usageKeys.all, "me"] as const,
};

interface BillingPlanApiResponse {
  success: true;
  data: {
    plan: "FREE" | "PAID" | "INTERNAL";
    monthlyLimit: number;
    balance: number; // Remaining messages
    periodStart: string; // ISO 8601
    periodEnd: string; // ISO 8601
  };
}

/**
 * Fetches the current user's usage snapshot
 */
async function fetchUsageSnapshot(): Promise<UsageSnapshot> {
  const response = await apiClient.get<BillingPlanApiResponse>("/billing/plan");

  const planData = response.data.data;
  const remaining = planData.balance;
  const used = planData.monthlyLimit - remaining;
  const percentUsed =
    planData.monthlyLimit > 0
      ? Math.round((used / planData.monthlyLimit) * 100)
      : 0;

  const periodKey = planData.periodStart.substring(0, 7); // "2025-01-01T..." -> "2025-01"

  return {
    planKey: planData.plan,
    monthlyLimit: planData.monthlyLimit,
    used,
    remaining,
    percentUsed,
    periodKey,
    periodStart: planData.periodStart,
    periodEnd: planData.periodEnd,
    source: "subscription_active",
  };
}

/**
 * Hook to fetch and monitor the current user's usage data
 *
 * Automatically refetches:
 * - On window focus
 * - Every 5 minutes (to stay current)
 * - After mutations that consume usage
 */
export function useUsageSnapshot(
  options?: Omit<UseQueryOptions<UsageSnapshot>, "queryKey" | "queryFn">
) {
  return useQuery<UsageSnapshot>({
    queryKey: usageKeys.snapshot(),
    queryFn: fetchUsageSnapshot,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) or 429 (limit exceeded)
      if (error?.response?.status === 401 || error?.response?.status === 429) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * Hook variant that returns computed usage state
 */
export function useUsageState() {
  const { data: usage, ...query } = useUsageSnapshot();

  return {
    ...query,
    usage,
    isNearLimit: usage ? usage.percentUsed >= 80 : false,
    isAtLimit: usage ? usage.remaining <= 0 : false,
    percentUsed: usage?.percentUsed ?? 0,
    remaining: usage?.remaining ?? 0,
    used: usage?.used ?? 0,
    planKey: usage?.planKey,
  };
}

/**
 * User identity data from /api/me
 */
export interface UserIdentity {
  userId: string;
  email: string;
  plan: PlanKey;
}

interface UserIdentityApiResponse {
  success: true;
  data: UserIdentity;
}

/**
 * Fetches the current user's identity from /api/me
 */
async function fetchUserIdentity(): Promise<UserIdentity> {
  const response = await apiClient.get<UserIdentityApiResponse>("/me");
  return response.data.data;
}

/**
 * Hook to fetch the current user's identity
 */
export function useUserIdentity(
  options?: Omit<UseQueryOptions<UserIdentity>, "queryKey" | "queryFn">
) {
  return useQuery<UserIdentity>({
    queryKey: usageKeys.me(),
    queryFn: fetchUserIdentity,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}
