"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppLayout } from "@components/AppLayout";
import { useAuthStore } from "@store/auth.store";
import { PageLoader } from "@components/ui/page-loader";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isInitialized, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/auth/sign-in");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) {
    return <PageLoader />;
  }

  return <AppLayout>{children}</AppLayout>;
}
