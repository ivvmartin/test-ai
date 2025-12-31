"use client";

import dynamic from "next/dynamic";

import { PageLoader } from "@components/ui/page-loader";

const ChatPage = dynamic(
  () => import("@features/ai/chat").then((mod) => ({ default: mod.ChatPage })),
  {
    loading: () => <PageLoader />,
    ssr: false,
  }
);

export default function ChatWithConversation() {
  return <ChatPage />;
}
