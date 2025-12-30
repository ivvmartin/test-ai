"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ResetPassword from "@features/auth/ResetPassword";
import { useAuthStore } from "@store/auth.store";
import { PageLoader } from "@components/ui/page-loader";

export default function ResetPasswordPage() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/app/chat");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || isAuthenticated) {
    return <PageLoader />;
  }

  return <ResetPassword />;
}
