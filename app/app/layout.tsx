"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppLayout } from "@components/app-layout/AppLayout";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { PageLoader } from "@components/ui/page-loader";
import { useAuthStore } from "@store/auth.store";

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

  return (
    <ErrorBoundary>
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
}
