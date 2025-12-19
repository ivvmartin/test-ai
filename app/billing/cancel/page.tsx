"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        <div className="flex justify-center">
          <div className="rounded-full bg-orange-100 p-4 dark:bg-orange-900/20">
            <XCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-bold text-2xl">Checkout Canceled</h1>
          <p className="text-muted-foreground">
            Your checkout was canceled. No charges were made to your account
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push("/app/billing")}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button
            onClick={() => router.push("/app")}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
