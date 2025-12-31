"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@components/ui/page-loader";

const BillingPage = dynamic(
  () =>
    import("@features/home/billing").then((mod) => ({
      default: mod.BillingPage,
    })),
  {
    loading: () => <PageLoader />,
    ssr: false,
  }
);

export default function Billing() {
  return <BillingPage />;
}
