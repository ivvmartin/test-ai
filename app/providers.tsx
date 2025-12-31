"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "@components/ErrorBoundary";
import { useAuthInitialization } from "@utils/hooks";
import { queryClient } from "@utils/queries";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthInitialization();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
}
