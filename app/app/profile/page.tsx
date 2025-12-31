"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@components/ui/page-loader";

const Profile = dynamic(
  () =>
    import("@features/home/profile").then((mod) => ({ default: mod.Profile })),
  {
    loading: () => <PageLoader />,
    ssr: false,
  }
);

export default function ProfilePage() {
  return <Profile />;
}
