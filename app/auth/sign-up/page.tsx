"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import SignUp from "@features/auth/SignUp";
import { useAuthStore } from "@store/auth.store";

export default function SignUpPage() {
  const router = useRouter();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/app/chat");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <SignUp />;
}
