"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { useHydration } from "@/hooks/use-hydration";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (hydrated && !isAuthenticated) {
      router.replace("/auth/sign-in");
    }
  }, [hydrated, isAuthenticated, router]);

  // Show nothing while hydrating to prevent flash
  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
