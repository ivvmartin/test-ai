"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Crown,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { UsageIndicator } from "@components/UsageIndicator";
import {
  useBillingStatus,
  useCreateCheckoutSession,
  useCreatePortalSession,
} from "@utils/billing-queries";
import { useUsageSnapshot } from "@utils/usage-queries";

export function BillingPage() {
  const { data: usage } = useUsageSnapshot();
  const { data: billing, isLoading: isLoadingBilling } = useBillingStatus();

  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();

  const handleUpgrade = () => {
    checkoutMutation.mutate("PREMIUM", {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Неуспешно създаване на сесия за плащане. Моля, опитайте отново"
        );
      },
    });
  };

  const handleManageSubscription = () => {
    portalMutation.mutate(undefined, {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Неуспешно отваряне на портала за плащания. Моля, опитайте отново."
        );
      },
    });
  };

  const isPremium = billing?.planKey === "PREMIUM";
  const isActive =
    billing?.status === "active" || billing?.status === "trialing";
  const isPastDue = billing?.status === "past_due";
  const isCanceled = billing?.cancelAtPeriodEnd;

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-lg tracking-tight">
            Абонамент и плащане
          </h1>
          <p className="text-muted-foreground">
            Управлявайте вашия абонамент и методи на плащане
          </p>
        </div>

        {/* Subscription Status */}
        <div className="space-y-4 mt-14">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-base">Абонамент</h3>

            {isLoadingBilling ? (
              <Skeleton className="h-6 w-32" />
            ) : billing && isPremium ? (
              <>
                {isActive ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-5 text-green-700" />
                    <span className="text-base font-medium text-green-700">
                      {billing.status === "trialing"
                        ? "Пробен период активен"
                        : "Активен"}
                    </span>
                  </div>
                ) : isPastDue ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-yellow-600" />
                    <span className="text-base font-medium text-yellow-700">
                      Неуспешно плащане
                    </span>
                  </div>
                ) : null}

                {isCanceled && billing.currentPeriodEnd && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-5 text-orange-600" />
                    <span className="text-base font-medium text-orange-700">
                      Прекратява се на{" "}
                      {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>

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
                        {isPremium ? "Pro план" : "Безплатен план"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium
                          ? usage?.monthlyLimit
                            ? `${usage.monthlyLimit} съобщения на месец`
                            : "50 съобщения на месец"
                          : usage?.monthlyLimit
                          ? `${usage.monthlyLimit} съобщения на месец`
                          : "10 съобщения на месец"}
                      </p>
                    </div>
                  </div>
                  {isPremium ? (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={portalMutation.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      {portalMutation.isPending ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Отваряне...
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-4" />
                          Управление на абонамента
                          <ExternalLink className="size-3" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      disabled={checkoutMutation.isPending}
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Пренасочване...
                        </>
                      ) : (
                        <>
                          <Crown className="size-4" />
                          Надградете до Pro
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Renewal Date */}
                {isPremium && billing.currentPeriodEnd && !isCanceled && (
                  <p className="text-sm text-muted-foreground">
                    {billing.status === "trialing"
                      ? "Пробният период приключва"
                      : "Подновява се"}{" "}
                    на {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </p>
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
                        Неуспешно плащане
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500">
                        Моля, актуализирайте метода си на плащане, за да
                        продължите да използвате Pro функциите.
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
          <h3 className="font-semibold text-base">Текуща употреба</h3>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <UsageIndicator variant="full" showPlanBadge={false} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
