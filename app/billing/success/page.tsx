"use client";

import { Button } from "@/components/ui/button";
import { billingKeys } from "@/utils/billing-queries";
import { usageKeys } from "@/utils/usage-queries";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate billing and usage queries to refresh data
    queryClient.invalidateQueries({ queryKey: billingKeys.status() });
    queryClient.invalidateQueries({ queryKey: usageKeys.snapshot() });
  }, [queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-bold text-2xl">Welcome to Premium!</h1>
          <p className="text-muted-foreground">
            Your subscription has been activated successfully. You now have
            access to all premium features
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push("/app")}
            className="w-full"
            size="lg"
          >
            Start Using Premium →
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
