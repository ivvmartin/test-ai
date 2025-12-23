"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Copy, CornerRightUp } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useNavigate, useParams } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat.types";
import { MarkdownContent } from "@components/MarkdownContent";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { BouncingDots } from "@components/ui/bouncing-dots";
import { Skeleton } from "@components/ui/skeleton";
import { Textarea } from "@components/ui/textarea";
import { useAuthStore } from "@store/auth.store";
import {
  useCreateConversationMutation,
  useStreamingMessage,
} from "@utils/chat-mutations";
import { useMessagesQuery } from "@utils/chat-queries";
import { useAutoResizeTextarea } from "@utils/hooks";
import { useUsageState } from "@utils/usage-queries";

const MessageItem = memo(
  ({ message, userEmail }: { message: Message; userEmail?: string }) => {
    if (message.role === "user") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-row gap-3 px-1 py-2 sm:gap-4 sm:px-2"
        >
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
            <span className="font-medium text-foreground text-sm">
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted rounded-2xl text-xs flex items-center justify-center">
                  {userEmail?.replace(/@.*$/, "")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center">
            <p className="text-foreground break-words text-sm leading-relaxed sm:text-base">
              {message.content}
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-muted/30 group relative flex gap-3 rounded-xl px-3 py-4 sm:gap-4 sm:px-4 sm:py-5"
      >
        <Bot className="bg-primary/10 text-primary flex size-8 shrink-0 rounded-full p-1.5" />
        {message.content === "..." ? (
          <div className="flex min-w-0 flex-1 items-center">
            <BouncingDots />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "text-foreground min-w-0 flex-1 overflow-x-auto text-sm leading-relaxed sm:text-base",
                message.content === "Нещо се обърка. Моля, опитайте отново"
                  ? "rounded-lg border border-destructive/10 bg-destructive/10 p-3"
                  : ""
              )}
            >
              <MarkdownContent content={message.content} />
            </div>
            <button
              type="button"
              title="Копирай в клипборда"
              className="bg-background/80 hover:bg-background border-border/50 absolute top-3 right-3 rounded-md border p-1.5 opacity-0 shadow-sm transition-all hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success("Копирано в клипборда");
              }}
            >
              <Copy className="text-muted-foreground h-3.5 w-3.5" />
            </button>
          </>
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content
    );
  }
);

MessageItem.displayName = "MessageItem";

function AiInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  disabled,
  isNearLimit,
  isAtLimit,
  usage,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
  usage?: {
    used: number;
    monthlyLimit: number;
    remaining: number;
    periodEnd: string;
  };
}) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 50,
    maxHeight: 200,
  });

  const showWarning = isNearLimit || isAtLimit;

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Warning Banner */}
        {showWarning && (
          <div
            className={cn(
              "flex items-center justify-between rounded-t-2xl border border-b-0 px-5 py-2.5 transition-all duration-200 bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium text-xs",
                  isAtLimit ? "text-destructive" : "text-yellow-700"
                )}
              >
                {usage?.remaining || 0} оставащи съобщения
              </span>
            </div>
            <a
              href="/app/billing"
              className={cn(
                "font-medium underline-offset-4 hover:underline text-xs",
                isAtLimit ? "text-destructive" : "text-yellow-700"
              )}
            >
              {isAtLimit
                ? "Надградете, за да продължите"
                : "Надградете за повече"}
            </a>
          </div>
        )}

        <Textarea
          ref={textareaRef}
          id="ai-input-06"
          placeholder={
            isAtLimit
              ? "Лимитът за използване е достигнат. Надградете, за да продължите."
              : "Напишете вашия въпрос за ДДС тук…"
          }
          className={cn(
            "bg-muted/50 text-foreground placeholder:text-muted-foreground/70 w-full resize-none border border-input py-4 pr-12 pl-5 leading-relaxed",
            "min-h-[56px] transition-all duration-200 shadow-sm",
            "focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50",
            showWarning ? "rounded-b-2xl rounded-t-none" : "rounded-2xl",
            disabled && "cursor-not-allowed opacity-60"
          )}
          value={value}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            onChange(e);
            adjustHeight();
          }}
          disabled={disabled}
        />
        <button
          onClick={onSubmit}
          className={cn(
            "absolute bottom-3 right-3 rounded-lg p-2 transition-all duration-200",
            value.trim() && !disabled
              ? "bg-primary/10 hover:bg-primary/20 opacity-100"
              : "bg-muted cursor-not-allowed opacity-40"
          )}
          type="button"
          disabled={!value.trim() || disabled}
          aria-label="Send message"
        >
          <CornerRightUp
            className={cn(
              "h-5 w-5 transition-colors",
              value.trim() && !disabled
                ? "text-primary"
                : "text-muted-foreground"
            )}
          />
        </button>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    dataUpdatedAt,
  } = useMessagesQuery(conversationId);

  const { isNearLimit, isAtLimit, usage } = useUsageState();

  const showSkeleton =
    isLoadingMessages && messages.length === 0 && dataUpdatedAt === 0;

  // Check if there's a loading message (AI is thinking)
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

      let targetConversationId = conversationId;

      if (!targetConversationId) {
        setIsGenerating(true);

        try {
          const newConv = await createConversationMutation.mutateAsync({
            title: "Нов разговор",
          });
          targetConversationId = newConv.id;

          navigate(`/app/chat/${targetConversationId}`);

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Failed to create conversation:", error);
          toast.error(
            "Неуспешно създаване на разговор. Моля, опитайте отново."
          );
          setIsGenerating(false);
          return;
        }
      } else {
        setIsGenerating(true);
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

  if (!conversationId) {
    return (
      <div className="flex h-[calc(70vh-2.5rem)] w-full items-center justify-center p-4">
        <div className="flex w-full max-w-xl flex-col items-center justify-center space-y-10">
          <div className="space-y-4 text-center">
            <h1 className="font-semibold text-2xl tracking-tight md:text-2xl">
              Незабавна яснота относно българския ДДС
            </h1>
            <p className="text-muted-foreground text-base md:text-md">
              Задайте въпрос по ЗДДС и получете ясно и структурирано обяснение,
              съобразено с конкретния ви случай
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <AiInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              disabled={isAtLimit}
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
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                <MessageItem message={message} userEmail={user?.email} />
              </div>
            ))}
          </AnimatePresence>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit}>
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
  );
}
