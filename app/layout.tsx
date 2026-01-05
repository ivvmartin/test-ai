import type { Metadata } from "next";

import "@/index.css";
import { Toaster } from "@components/ui/sonner";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "EVTA AI | Данъчен AI",
  description: "Вашият интeлигeнтeн данъчeн партньор",
  icons: {
    icon: [
      { url: "/brand-favicon/favicon.ico" },
      {
        url: "/brand-favicon/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/brand-favicon/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/brand-favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
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
