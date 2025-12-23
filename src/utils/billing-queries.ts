import type { BillingStatus } from "@/types/billing.types";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

export const billingKeys = {
  all: ["billing"] as const,
  status: () => [...billingKeys.all, "status"] as const,
};

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

export function useBillingStatus(
  options?: Omit<UseQueryOptions<BillingStatus>, "queryKey" | "queryFn">
) {
  return useQuery<BillingStatus>({
    queryKey: billingKeys.status(),
    queryFn: fetchBillingStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

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

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (checkoutUrl) => {
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    },
  });
}

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

export function useCreatePortalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPortalSession,
    onSuccess: (portalUrl) => {
      window.location.href = portalUrl;
    },
    onSettled: () => {
      // Invalidate billing status after returning from portal
      // (User might have updated their subscription)
      queryClient.invalidateQueries({ queryKey: billingKeys.status() });
    },
  });
}
