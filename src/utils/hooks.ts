"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/store/auth.store";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Initialize Supabase Auth. Subscribes to auth state changes and updates the auth store
 */
export const useAuthInitialization = () => {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session?.user);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuthenticated, setInitialized]);
};
