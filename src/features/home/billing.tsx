"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Crown,
  ExternalLink,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";
import {
  useBillingStatus,
  useCreateCheckoutSession,
  useCreatePortalSession,
} from "@/utils/billing-queries";
import { useUsageSnapshot } from "@/utils/usage-queries";

export function BillingPage() {
  const { data: usage, isLoading: isLoadingUsage } = useUsageSnapshot();
  const { data: billing, isLoading: isLoadingBilling } = useBillingStatus();
  const quotaPercentage = usage ? usage.percentUsed : 0;

  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();

  const handleUpgrade = () => {
    const loadingToast = toast.loading("Redirecting to checkout...");
    checkoutMutation.mutate("PREMIUM", {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create checkout session. Please try again.",
          { id: loadingToast }
        );
      },
    });
  };

  const handleManageSubscription = () => {
    const loadingToast = toast.loading("Opening billing portal...");
    portalMutation.mutate(undefined, {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to open billing portal. Please try again.",
          { id: loadingToast }
        );
      },
    });
  };

  const isPremium = billing?.planKey === "PREMIUM";
  const isActive =
    billing?.status === "active" || billing?.status === "trialing";
  const isPastDue = billing?.status === "past_due";
  const isCanceled = billing?.cancelAtPeriodEnd;

  console.log("currentPeriodEnd", billing);

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Subscription Status */}
        <div className="space-y-4 mt-14">
          <h3 className="font-semibold text-base">Subscription</h3>

          {isLoadingBilling ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          ) : billing ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPremium ? (
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100">
                        <Crown className="size-6 text-[#21355a]" />
                      </div>
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100">
                        <Sparkles className="size-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-md">
                        {isPremium ? "Pro Plan" : "Free Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium
                          ? usage?.monthlyLimit
                            ? `${usage.monthlyLimit} messages per month`
                            : "50 messages per month"
                          : usage?.monthlyLimit
                          ? `${usage.monthlyLimit} messages per month`
                          : "10 messages per month"}
                      </p>
                    </div>
                  </div>
                  {!isPremium ? (
                    <Button
                      onClick={handleUpgrade}
                      disabled={checkoutMutation.isPending}
                      className="gap-2"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <Crown className="size-4" />
                          Upgrade to Pro
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-5 text-green-600" />
                          <span className="text-base font-medium text-green-600">
                            {billing.status === "trialing"
                              ? "Trial Active"
                              : "Active"}
                          </span>
                        </div>
                      ) : isPastDue ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="size-5 text-yellow-600" />
                          <span className="text-base font-medium text-yellow-700">
                            Payment Failed
                          </span>
                        </div>
                      ) : null}

                      {isCanceled && billing.currentPeriodEnd && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="size-5 text-orange-600" />
                          <span className="text-base font-medium text-orange-700">
                            Cancels on{" "}
                            {new Date(
                              billing.currentPeriodEnd
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Renewal Date */}
                {isPremium && billing.currentPeriodEnd && !isCanceled && (
                  <p className="text-sm text-muted-foreground">
                    {billing.status === "trialing" ? "Trial ends" : "Renews"} on{" "}
                    {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}

                {/* Action Buttons */}
                {isPremium && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleManageSubscription}
                      disabled={portalMutation.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      {portalMutation.isPending ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-4" />
                          Manage Subscription
                          <ExternalLink className="size-3" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Payment Issue Warning */}
                {isPastDue && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-50 p-3 dark:bg-yellow-950/20"
                  >
                    <AlertCircle className="size-4 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        Payment failed
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        Please update your payment method to continue using Pro
                        features.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Current Usage */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base">Current Usage</h3>

          {isLoadingUsage ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="size-16 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : usage ? (
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Messages Used</p>
                    <p className="text-base font-bold mt-4">
                      {usage.used} / {usage.monthlyLimit}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${quotaPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full",
                        quotaPercentage >= 80
                          ? "bg-destructive"
                          : quotaPercentage >= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                    />
                  </div>
                </div>

                {/* Usage Insights */}
                {quotaPercentage >= 80 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-start gap-2 rounded-md border p-3",
                      usage.remaining <= 0
                        ? "border-destructive/20 bg-destructive/10"
                        : "border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20"
                    )}
                  >
                    <TrendingUp
                      className={cn(
                        "size-4 mt-0.5 flex-shrink-0",
                        usage.remaining <= 0
                          ? "text-destructive"
                          : "text-yellow-600 dark:text-yellow-500"
                      )}
                    />
                    <div className="space-y-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          usage.remaining <= 0
                            ? "text-destructive"
                            : "text-yellow-700 dark:text-yellow-400"
                        )}
                      >
                        {usage.remaining <= 0
                          ? "Monthly limit reached"
                          : "Approaching your limit"}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          usage.remaining <= 0
                            ? "text-muted-foreground"
                            : "text-yellow-600 dark:text-yellow-500"
                        )}
                      >
                        {usage.remaining <= 0
                          ? "Upgrade your plan to continue chatting"
                          : "Consider upgrading to avoid interruptions"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
