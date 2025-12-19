"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydration";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hydrated) {
      if (isAuthenticated) {
        router.replace("/app/chat");
      } else {
        router.replace("/auth/sign-in");
      }
    }
  }, [hydrated, isAuthenticated, router]);

  return null;
}
