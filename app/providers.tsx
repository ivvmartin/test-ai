"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/queries";
import { useAuthInitialization } from "@/hooks/use-auth-initialization";

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthInitialization();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
