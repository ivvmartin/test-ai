import { useMutation, useQueryClient } from "@tanstack/react-query";

import apiClient from "@/lib/axios";
import { usageKeys } from "./usage-queries";

export const billingKeys = {
  all: ["billing"] as const,
  plan: () => [...billingKeys.all, "plan"] as const,
};

interface CheckoutSessionResponse {
  success: boolean;
  data: {
    url: string;
  };
  error?: {
    message: string;
  };
}

interface PortalSessionResponse {
  success: boolean;
  data: {
    url: string;
  };
  error?: {
    message: string;
  };
}

async function createCheckoutSession(plan: "PREMIUM"): Promise<string> {
  const response = await apiClient.post<CheckoutSessionResponse>(
    "/billing/checkout-session",
    { plan }
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || "Failed to create checkout session"
    );
  }

  return response.data.data.url;
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
  const response = await apiClient.post<PortalSessionResponse>(
    "/billing/portal-session"
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || "Failed to create portal session"
    );
  }

  return response.data.data.url;
}

export function useCreatePortalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPortalSession,
    onSuccess: (portalUrl) => {
      window.location.href = portalUrl;
    },
    onSettled: () => {
      // Invalidate usage snapshot after returning from portal
      // (User might have updated their subscription)
      queryClient.invalidateQueries({ queryKey: usageKeys.snapshot() });
    },
  });
}
