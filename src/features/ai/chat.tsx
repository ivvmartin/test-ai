"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useNavigate, useParams } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@components/ui/sidebar";
import { Skeleton } from "@components/ui/skeleton";
import {
  useCreateConversationMutation,
  useStreamingMessage,
} from "@utils/chat-mutations";
import { useMessagesQuery } from "@utils/chat-queries";
import { useUsageState, useUserIdentity } from "@utils/usage-queries";
import { AiInput, ChatNotFound, ChatWelcome, MessageItem } from "./components";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { data: userIdentity } = useUserIdentity();
  const { state: sidebarState, isMobile } = useSidebar();

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    dataUpdatedAt,
    error: messagesError,
  } = useMessagesQuery(conversationId);
  const { isNearLimit, isAtLimit, usage } = useUsageState();

  const showSkeleton =
    isLoadingMessages && messages.length === 0 && dataUpdatedAt === 0;

  const hasLoadingMessage = messages.some((msg) => msg.content === "...");

  const createConversationMutation = useCreateConversationMutation({
    onSuccess: (newConversation) => {
      navigate(`/app/chat/${newConversation.id}`);
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
      toast.error("Неуспешно създаване на разговор. Моля, опитайте отново");
    },
  });

  const { sendMessage, isStreaming } = useStreamingMessage(conversationId, {
    onComplete: () => {
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsGenerating(false);
    },
  });

  const scrollToBottomRef = useRef<number | null>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    const shouldScroll =
      messages.length > prevMessagesLengthRef.current || isStreaming;

    if (shouldScroll && messagesEndRef.current) {
      if (scrollToBottomRef.current) {
        cancelAnimationFrame(scrollToBottomRef.current);
      }

      scrollToBottomRef.current = requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior:
            messages.length > prevMessagesLengthRef.current ? "smooth" : "auto",
        });
      });
    }

    prevMessagesLengthRef.current = messages.length;

    return () => {
      if (scrollToBottomRef.current) {
        cancelAnimationFrame(scrollToBottomRef.current);
      }
    };
  }, [messages.length, isStreaming]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (
        !input.trim() ||
        isGenerating ||
        isStreaming ||
        isAtLimit ||
        isLoadingMessages ||
        hasLoadingMessage
      )
        return;

      const userMessageContent = input.trim();
      setInput("");

      // Set loading state immediately for instant feedback
      setIsGenerating(true);

      let targetConversationId = conversationId;

      if (!targetConversationId) {
        try {
          const newConv = await createConversationMutation.mutateAsync({
            title: "Нов разговор",
          });
          targetConversationId = newConv.id;

          navigate(`/app/chat/${targetConversationId}`);

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to create conversation:", error);
          toast.error("Неуспешно създаване на разговор. Моля, опитайте отново");
          setIsGenerating(false);
          return;
        }
      }

      await sendMessage(userMessageContent, targetConversationId);
    },
    [
      input,
      isGenerating,
      isStreaming,
      conversationId,
      createConversationMutation,
      navigate,
      sendMessage,
      isAtLimit,
      isLoadingMessages,
      hasLoadingMessage,
    ]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (
          !isGenerating &&
          !isStreaming &&
          !isAtLimit &&
          !isLoadingMessages &&
          !hasLoadingMessage
        ) {
          handleSubmit();
        }
      }
    },
    [
      handleSubmit,
      isGenerating,
      isStreaming,
      isAtLimit,
      isLoadingMessages,
      hasLoadingMessage,
    ]
  );

  // Check if conversation was not found (404 error)
  const isNotFound =
    messagesError &&
    (messagesError.message.includes("404") ||
      messagesError.message.includes("not found"));

  if (isNotFound) {
    return <ChatNotFound />;
  }

  if (!conversationId) {
    return (
      <ChatWelcome
        input={input}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        isAtLimit={isAtLimit}
        isNearLimit={isNearLimit}
        usage={
          usage
            ? {
                used: usage.used,
                monthlyLimit: usage.monthlyLimit,
                remaining: usage.remaining,
                periodEnd: usage.periodEnd,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Messages area */}
      <div className="h-full overflow-y-auto pb-32">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
          {showSkeleton ? (
            // Loading skeleton
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
          ) : messages.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <div key={message.id} className="mb-6 last:mb-0">
                  <MessageItem
                    message={message}
                    userEmail={userIdentity?.email}
                  />
                </div>
              ))}
            </AnimatePresence>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className={cn(
          "pointer-events-none fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 transition-[left] duration-200 ease-linear",
          !isMobile &&
            sidebarState === "expanded" &&
            "md:left-[var(--sidebar-width)]"
        )}
      >
        <div className="mx-auto w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="pointer-events-auto">
            <AiInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              disabled={
                isAtLimit ||
                isGenerating ||
                isStreaming ||
                isLoadingMessages ||
                hasLoadingMessage
              }
              isNearLimit={isNearLimit}
              isAtLimit={isAtLimit}
              usage={
                usage
                  ? {
                      used: usage.used,
                      monthlyLimit: usage.monthlyLimit,
                      remaining: usage.remaining,
                      periodEnd: usage.periodEnd,
                    }
                  : undefined
              }
            />
          </form>
        </div>
      </div>
    </div>
  );
}
