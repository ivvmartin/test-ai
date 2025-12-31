"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useRouter as useNextRouter,
  usePathname,
  useParams as useNextParams,
} from "next/navigation";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";

export function useNavigate() {
  const router = useNextRouter();

  return useCallback(
    (to: string | number, options?: { replace?: boolean; state?: any }) => {
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
    },
    [router]
  );
}

export function useLocation() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setHash(window.location.hash);
    setSearch(window.location.search);

    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    const handlePopState = () => {
      setHash(window.location.hash);
      setSearch(window.location.search);
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return {
    pathname,
    search,
    hash,
    state: null,
    key: "default",
  };
}

export function useParams<T = Record<string, string>>(): T {
  return useNextParams() as T;
}

export const Link = NextLink;

export function Navigate({
  to,
  replace = false,
}: {
  to: string;
  replace?: boolean;
  state?: any;
}) {
  const router = useNextRouter();

  if (replace) {
    router.replace(to);
  } else {
    router.push(to);
  }

  return null;
}
