"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@store/auth.store";
import { PageLoader } from "@components/ui/page-loader";

export default function HomePage() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.replace("/app/chat");
      } else {
        router.replace("/auth/sign-in");
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  return <PageLoader />;
}
