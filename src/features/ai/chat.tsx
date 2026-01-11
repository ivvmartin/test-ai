"use client";

import { useParams } from "@/lib/navigation";
import { useSidebar } from "@components/ui/sidebar";
import { useMessagesQuery } from "@utils/chat-queries";
import { useUsageState, useUserIdentity } from "@utils/usage-queries";
import { ChatInputArea, ChatMessages } from "./components";
import { useChat } from "./hooks/useChat";
import { ChatNotFound } from "./pages/ChatNotFound";
import { ChatWelcome } from "./pages/ChatWelcome";

/**
 * ChatPage - Main chat interface component
 * Handles routing between welcome screen, chat view, and error states
 */
export function ChatPage() {
  const { chatId } = useParams<{ chatId?: string }>();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: userIdentity } = useUserIdentity();

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    dataUpdatedAt,
    error: messagesError,
  } = useMessagesQuery(chatId);
  const { isNearLimit, isAtLimit, usage } = useUsageState();

  const hasLoadingMessage = messages.some((msg) => msg.content === "...");

  const { input, setInput, isGenerating, isStreaming, handleSubmit } = useChat({
    chatId,
    isAtLimit,
    isLoadingMessages,
    hasLoadingMessage,
  });

  const usageData = usage
    ? {
        used: usage.used,
        monthlyLimit: usage.monthlyLimit,
        remaining: usage.remaining,
        periodEnd: usage.periodEnd,
      }
    : undefined;

  const isNotFound =
    messagesError &&
    (messagesError.message.includes("404") ||
      messagesError.message.includes("not found"));

  if (isNotFound) {
    return <ChatNotFound />;
  }

  if (!chatId) {
    return (
      <ChatWelcome
        input={input}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        isAtLimit={isAtLimit}
        isNearLimit={isNearLimit}
        usage={usageData}
      />
    );
  }

  return (
    <>
      <ChatMessages
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        dataUpdatedAt={dataUpdatedAt}
        userEmail={userIdentity?.email}
        isMobile={isMobile}
      />
      <ChatInputArea
        input={input}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        isDisabled={
          isAtLimit ||
          isGenerating ||
          isStreaming ||
          isLoadingMessages ||
          hasLoadingMessage
        }
        isNearLimit={isNearLimit}
        isAtLimit={isAtLimit}
        usage={usageData}
        sidebarState={sidebarState}
        isMobile={isMobile}
      />
    </>
  );
}
