import type { Metadata } from "next";

import { Toaster } from "@components/ui/sonner";
import "@/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ЕВТА Консулт | Данъчен AI",
  description: "AI-базирана платформа за ДДС консултации",
  icons: {
    icon: "/brand.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body>
        <Providers>
          {children}

          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
