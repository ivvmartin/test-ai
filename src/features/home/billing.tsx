"use client";

import { motion } from "framer-motion";
import { CreditCard, Crown, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PlansDialog } from "@components/PlansDialog";
import { Button } from "@components/ui/button";
import { Skeleton } from "@components/ui/skeleton";
import { UsageIndicator } from "@components/UsageIndicator";
import {
  useCreateCheckoutSession,
  useCreatePortalSession,
} from "@utils/billing-queries";
import { useUsageSnapshot } from "@utils/usage-queries";

export function BillingPage() {
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);

  const { data: usage, isLoading: isLoadingPlan } = useUsageSnapshot();

  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();

  const handleOpenPlansDialog = () => {
    setPlansDialogOpen(true);
  };

  const handleSelectPremium = () => {
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

  const isPremium = usage?.planKey === "PAID";

  const getPlanDisplayName = () => {
    if (!usage) return "";
    switch (usage.planKey) {
      case "TRIAL":
        return "Пробен план";
      case "PAID":
        return "Premium план";
      case "FREE_INTERNAL":
        return "Безплатен план";
      case "INTERNAL":
        return "Служебен план";
      default:
        return "Неизвестен план";
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 md:space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="font-bold text-xl tracking-tight">
            Абонамент и плащане
          </h1>
          <p className="text-muted-foreground text-[15px] mt-1">
            Управлявайте вашия абонамент и методи на плащане
          </p>
        </div>

        {/* Plan Status - Hidden for INTERNAL plan */}
        {usage?.planKey !== "INTERNAL" && (
          <div className="space-y-4 mt-8 md:mt-14">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h3 className="font-semibold text-base">Активен абонамент</h3>
            </div>

            {isLoadingPlan ? (
              <div className="rounded-lg border bg-card p-4 md:p-6">
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
            ) : usage ? (
              <div className="rounded-lg border bg-card p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      {isPremium ? (
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                          <Crown className="size-5 md:size-6 text-[#21355a]" />
                        </div>
                      ) : (
                        <div className="flex size-10 md:size-12 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                          <Sparkles className="size-5 md:size-6 text-gray-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-base">
                          {getPlanDisplayName()}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {usage.planKey === "TRIAL"
                            ? `${usage.monthlyLimit} съобщения за 7 дни`
                            : `${usage.monthlyLimit} съобщения на месец`}
                        </p>
                      </div>
                    </div>
                    {isPremium ? (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={portalMutation.isPending}
                        variant="outline"
                        className="gap-1.5 md:gap-2 text-xs md:text-sm w-full sm:w-auto"
                        size="sm"
                      >
                        {portalMutation.isPending ? (
                          <>
                            <span className="size-3 md:size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span className="hidden sm:inline">
                              Отваряне...
                            </span>
                            <span className="sm:hidden">Зареждане...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="size-3 md:size-4" />
                            <span className="hidden md:inline">
                              Управление на абонамента
                            </span>
                            <span className="md:hidden">Управление</span>
                            <ExternalLink className="size-3" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleOpenPlansDialog}
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 md:gap-2 text-xs md:text-sm w-full sm:w-auto"
                      >
                        <Crown className="size-3 md:size-4" />
                        Надградете до Premium
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Current Usage */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm md:text-base">
            Текущо потребление
          </h3>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <UsageIndicator variant="full" showPlanBadge={false} />
          </motion.div>
        </div>
      </motion.div>

      <PlansDialog
        open={plansDialogOpen}
        onOpenChange={setPlansDialogOpen}
        onSelectPremium={handleSelectPremium}
        isPending={checkoutMutation.isPending}
      />
    </div>
  );
}
