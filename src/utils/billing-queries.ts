/**
 * Billing Queries & Mutations
 *
 * React Query hooks for Stripe billing operations.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { BillingStatus } from "@/types/billing.types";

/**
 * Query key factory for billing-related queries
 */
export const billingKeys = {
  all: ["billing"] as const,
  status: () => [...billingKeys.all, "status"] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetches the current user's billing status
 */
async function fetchBillingStatus(): Promise<BillingStatus> {
  const response = await fetch("/api/billing/status", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch billing status");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Failed to fetch billing status");
  }

  return data.data;
}

/**
 * Hook to fetch the current user's billing/subscription status
 *
 * @example
 * ```tsx
 * const { data: billing, isLoading } = useBillingStatus();
 *
 * if (billing?.planKey === 'FREE') {
 *   return <UpgradeButton />;
 * }
 * ```
 */
export function useBillingStatus(
  options?: Omit<UseQueryOptions<BillingStatus>, "queryKey" | "queryFn">
) {
  return useQuery<BillingStatus>({
    queryKey: billingKeys.status(),
    queryFn: fetchBillingStatus,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Creates a Stripe Checkout Session for upgrading to PREMIUM
 */
async function createCheckoutSession(plan: "PREMIUM"): Promise<string> {
  const response = await fetch("/api/billing/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to create checkout session");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Failed to create checkout session");
  }

  return data.data.url;
}

/**
 * Hook to create a checkout session and redirect to Stripe
 *
 * @example
 * ```tsx
 * const upgradeMutation = useCreateCheckoutSession();
 *
 * const handleUpgrade = () => {
 *   upgradeMutation.mutate('PREMIUM');
 * };
 * ```
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (checkoutUrl) => {
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    },
  });
}

/**
 * Creates a Stripe Customer Portal Session for managing subscription
 */
async function createPortalSession(): Promise<string> {
  const response = await fetch("/api/billing/portal-session", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Failed to create portal session");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Failed to create portal session");
  }

  return data.data.url;
}

/**
 * Hook to create a portal session and redirect to Stripe Customer Portal
 *
 * @example
 * ```tsx
 * const portalMutation = useCreatePortalSession();
 *
 * const handleManageSubscription = () => {
 *   portalMutation.mutate();
 * };
 * ```
 */
export function useCreatePortalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPortalSession,
    onSuccess: (portalUrl) => {
      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl;
    },
    onSettled: () => {
      // Invalidate billing status after returning from portal
      // (User might have updated their subscription)
      queryClient.invalidateQueries({ queryKey: billingKeys.status() });
    },
  });
}
