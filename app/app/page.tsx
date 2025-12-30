"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageLoader } from "@components/ui/page-loader";

export default function AppIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/chat");
  }, [router]);

  return <PageLoader />;
}
