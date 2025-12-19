import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "EVTA Consult | VAT AI",
  description: "AI-powered VAT consulting platform",
  icons: {
    icon: "/evta-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
