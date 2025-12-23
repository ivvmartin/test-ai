"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { useAuthInitialization } from "@utils/hooks";
import { queryClient } from "@utils/queries";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthInitialization();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
