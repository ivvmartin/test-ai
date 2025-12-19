import { useEffect, useState } from "react";

/**
 * Hook to detect when Zustand persist has finished hydrating from localStorage.
 * This prevents hydration mismatches and ensures auth state is loaded before rendering.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for next tick to ensure Zustand has hydrated
    setHydrated(true);
  }, []);

  return hydrated;
}

