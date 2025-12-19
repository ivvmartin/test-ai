"use client";

/**
 * Navigation compatibility layer for Next.js migration
 * This file provides React Router-like APIs using Next.js navigation
 */

import { useRouter as useNextRouter, usePathname, useParams as useNextParams } from "next/navigation";
import NextLink from "next/link";
import { useCallback } from "react";

export function useNavigate() {
  const router = useNextRouter();
  
  return useCallback((to: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof to === "number") {
      // Handle back/forward navigation
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      }
      return;
    }
    
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router]);
}

export function useLocation() {
  const pathname = usePathname();
  
  return {
    pathname,
    search: "",
    hash: "",
    state: null,
    key: "default",
  };
}

export function useParams<T = Record<string, string>>(): T {
  return useNextParams() as T;
}

export const Link = NextLink;

export function Navigate({ to, replace = false }: { to: string; replace?: boolean; state?: any }) {
  const router = useNextRouter();
  
  if (replace) {
    router.replace(to);
  } else {
    router.push(to);
  }
  
  return null;
}

