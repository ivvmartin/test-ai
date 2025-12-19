"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth.store";

/**
 * Initialize Supabase Auth
 * 
 * Subscribes to auth state changes and updates the auth store.
 * Replaces the old token-based initialization.
 * 
 * Usage in providers:
 * ```ts
 * export function Providers({ children }) {
 *   useAuthInitialization();
 *   return <>{children}</>;
 * }
 * ```
 */
export const useAuthInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return { isInitialized };
};
