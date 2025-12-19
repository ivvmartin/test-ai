"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useHydration } from "@/hooks/use-hydration";
import SignIn from "@/features/auth/SignIn";

export default function SignInPage() {
  const router = useRouter();
  const hydrated = useHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/app/chat");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <SignIn />;
}
