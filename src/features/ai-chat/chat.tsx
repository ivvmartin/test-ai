"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Bot, Plus, Send, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "@/lib/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";
import type { Message } from "@/types/chat.types";
import {
  useCreateConversationMutation,
  useStreamingMessage,
} from "@/utils/chat-mutations";
import { useConversationsQuery, useMessagesQuery } from "@/utils/chat-queries";
import { useUsageState } from "@/utils/usage-queries";
import { cn } from "@utils/index";
import { toast } from "sonner";

import { ChatInput } from "./chat-input";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Backend queries
  const { data: conversations, isLoading: isLoadingConversations } =
    useConversationsQuery();
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useMessagesQuery(conversationId);
  const { isAtLimit, remaining } = useUsageState();

  // Backend mutations
  const createConversationMutation = useCreateConversationMutation({
    onSuccess: (newConversation) => {
      navigate(`/app/chat/${newConversation.id}`);
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create conversation. Please try again.");
    },
  });

  // New streaming message hook
  const { sendMessage, isStreaming } = useStreamingMessage(conversationId, {
    onComplete: () => {
      setIsGenerating(false);
      // Usage is tracked on the server side via usageService.consumeUsage()
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast.error(error || "Failed to send message. Please try again.");
      setIsGenerating(false);
    },
  });

  // Find current conversation from the list
  const conversation = conversations?.find((c) => c.id === conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    createConversationMutation.mutate({ title: "New Conversation" });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isGenerating || isStreaming) return;

    // Check usage limit before sending
    if (isAtLimit) {
      toast.error("Monthly usage limit reached", {
        description: "Upgrade your plan or wait for the next billing period",
      });
      return;
    }

    const userMessageContent = messageInput.trim();
    setMessageInput("");

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    let targetConversationId = conversationId;

    // If no conversation exists, create one first
    if (!targetConversationId) {
      // Set generating state BEFORE creating conversation
      setIsGenerating(true);

      try {
        const newConv = await createConversationMutation.mutateAsync({
          title: "New Conversation",
        });
        targetConversationId = newConv.id;

        // Navigate to the new conversation immediately
        // This ensures the user sees the loading state in the new conversation
        navigate(`/app/chat/${newConv.id}`);

        // Small delay to ensure navigation completes
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Failed to create conversation:", error);
        toast.error("Failed to create conversation. Please try again.");
        setIsGenerating(false);
        return;
      }
    } else {
      // Set generating state for existing conversations
      setIsGenerating(true);
    }

    // Send message with streaming AI response
    await sendMessage(userMessageContent, targetConversationId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Loading state
  if (isLoadingConversations) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="size-20 rounded-full bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-3 w-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  // When no conversation is selected, show ready state with input
  if (!conversationId) {
    return (
      <div className="flex h-[calc(80vh-3.5rem)] flex-col items-center justify-center p-8">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput
            value={messageInput}
            onChange={setMessageInput}
            onSend={handleSendMessage}
            disabled={isGenerating}
          />
        </div>
      </div>
    );
  }

  // Conversation not found or error loading messages
  // Only show error if we're done loading and still no conversation
  if (
    !isLoadingConversations &&
    !isLoadingMessages &&
    conversationId &&
    !conversation &&
    !messagesError
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="font-semibold text-xl">Conversation not found</h2>
          <p className="text-muted-foreground">
            This conversation may have been deleted or doesn't exist.
          </p>
          <Button onClick={handleNewChat} variant="outline" className="gap-2">
            <Plus className="size-4" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  // Error loading messages
  if (messagesError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="font-semibold text-xl">Error loading conversation</h2>
          <p className="text-muted-foreground">
            Failed to load messages. Please try again.
          </p>
          <Button onClick={handleNewChat} variant="outline" className="gap-2">
            <Plus className="size-4" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  // Loading messages
  if (isLoadingMessages) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center py-12 text-center"
              >
                <Bot className="mb-4 size-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  How can I help you today?
                </p>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  userName={"You"}
                  index={index}
                />
              ))
            )}
          </AnimatePresence>

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback>
                  <Bot className="size-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">AI Assistant</span>
                </div>
                <div className="flex gap-1">
                  <div className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                  <div className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                  <div className="size-2 animate-bounce rounded-full bg-primary/60" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-background p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Usage Limit Warning */}
          {isAtLimit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3"
            >
              <AlertCircle className="size-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Monthly message limit reached
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade your plan or wait until next month to continue
                  chatting
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAtLimit
                    ? "Message limit reached..."
                    : "Type your message..."
                }
                className="min-h-[44px] max-h-[200px] w-full resize-none rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={1}
                disabled={isGenerating || isAtLimit}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isGenerating || isAtLimit}
              size="icon"
              className="size-11 shrink-0"
              title={
                isAtLimit
                  ? "Monthly message limit reached"
                  : remaining !== undefined
                  ? `${remaining} messages remaining`
                  : undefined
              }
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  userName: string;
  index: number;
}

function MessageBubble({ message, userName, index }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex justify-center"
      >
        <div className="rounded-lg bg-muted px-4 py-2 text-center text-xs text-muted-foreground">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3"
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={isUser ? "text-primary" : "bg-primary/10"}>
          {isUser ? (
            <UserIcon className="size-4" />
          ) : (
            <Bot className="size-4 text-primary" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isUser ? userName : "ENVA Consult's AI"}
          </span>
        </div>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-lg px-4 py-2",
            isUser ? "bg-primary/5" : "bg-muted/50"
          )}
        >
          {isUser ? (
            <div className="text-foreground">{message.content}</div>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
