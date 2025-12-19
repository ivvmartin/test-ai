/**
 * Usage Queries
 *
 * React Query hooks for fetching usage data from the Next.js API routes.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { UsageSnapshot, UsageApiResponse } from "../types/usage.types";

/**
 * Query key factory for usage-related queries
 */
export const usageKeys = {
  all: ["usage"] as const,
  snapshot: () => [...usageKeys.all, "snapshot"] as const,
};

/**
 * Fetches the current user's usage snapshot from Next.js API route
 */
async function fetchUsageSnapshot(): Promise<UsageSnapshot> {
  const response = await fetch("/api/usage/me", {
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: "Failed to fetch usage", code: "FETCH_ERROR" },
    }));
    throw new Error(error.error?.message || "Failed to fetch usage");
  }

  const data: UsageApiResponse = await response.json();
  return data.data;
}

/**
 * Hook to fetch and monitor the current user's usage data
 *
 * Automatically refetches:
 * - On window focus
 * - Every 5 minutes (to stay current)
 * - After mutations that consume usage
 *
 * @example
 * ```tsx
 * const { data: usage, isLoading, error } = useUsageSnapshot();
 *
 * if (usage?.remaining === 0) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function useUsageSnapshot(
  options?: Omit<UseQueryOptions<UsageSnapshot>, "queryKey" | "queryFn">
) {
  return useQuery<UsageSnapshot>({
    queryKey: usageKeys.snapshot(),
    queryFn: fetchUsageSnapshot,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
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
 *
 * @example
 * ```tsx
 * const { isNearLimit, isAtLimit, percentUsed } = useUsageState();
 *
 * if (isAtLimit) {
 *   return <LimitReachedBanner />;
 * }
 * ```
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
