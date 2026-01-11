import { AnimatePresence } from "framer-motion";
import { memo } from "react";

import type { Message } from "@/types/chat.types";
import { Skeleton } from "@components/ui/skeleton";
import { MessageItem } from "./MessageItem";

interface ChatMessagesProps {
  messages: Message[];
  isLoadingMessages: boolean;
  dataUpdatedAt: number;
  userEmail?: string;
  isMobile: boolean;
}

/**
 * ChatMessages component - Displays the list of messages in a chat
 */
export const ChatMessages = memo(function ChatMessages({
  messages,
  isLoadingMessages,
  dataUpdatedAt,
  userEmail,
  isMobile,
}: ChatMessagesProps) {
  const showSkeleton =
    isLoadingMessages && messages.length === 0 && dataUpdatedAt === 0;

  return (
    <div className={`relative h-full w-full ${isMobile ? "" : "pl-6"}`}>
      {/* Messages area */}
      <div className="h-full overflow-y-auto pb-32">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
          {showSkeleton ? (
            <MessagesSkeleton />
          ) : messages.length > 0 ? (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className="mb-6 last:mb-0"
                >
                  <MessageItem message={message} userEmail={userEmail} />
                </div>
              ))}
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </div>
  );
});

/**
 * MessagesSkeleton - Loading skeleton for messages
 */
function MessagesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* User message skeleton */}
        <div className="flex flex-row gap-3 px-1 py-2 sm:gap-4 sm:px-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        {/* AI message skeleton */}
        <div className="bg-muted/30 flex gap-3 rounded-xl px-3 py-4 sm:gap-4 sm:px-4 sm:py-5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
