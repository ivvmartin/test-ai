import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useNavigate } from "@/lib/navigation";
import type { Chat, Message } from "@/types/chat.types";
import { chatQueryKeys } from "@/types/chat.types";
import {
  useCreateChatMutation,
  useDeleteChatMutation,
  useStreamingMessage,
} from "@utils/chat-mutations";

interface UseChatOptions {
  chatId?: string;
  isAtLimit: boolean;
  isLoadingMessages: boolean;
  hasLoadingMessage: boolean;
}

interface UseChatReturn {
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  isStreaming: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

/**
 * Custom hook that encapsulates all chat business logic
 */
export function useChat({
  chatId,
  isAtLimit,
  isLoadingMessages,
  hasLoadingMessage,
}: UseChatOptions): UseChatReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const createChatMutation = useCreateChatMutation();
  const deleteChatMutation = useDeleteChatMutation();

  const { sendMessage, isStreaming } = useStreamingMessage(chatId, {
    onComplete: () => {
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsGenerating(false);

      if (error.includes("Твърде много заявки")) {
        toast.error(error);
      }
    },
  });

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
      ) {
        return;
      }

      const userMessageContent = input.trim();

      /* NEW CHAT FLOW */
      if (!chatId) {
        // 1. Generate UUID and setup before navigation
        const targetChatId = crypto.randomUUID();
        const placeholderTitle = "Нов казус";
        const now = new Date().toISOString();

        // 2. Clear input and set generating state
        setInput("");
        setIsGenerating(true);

        // 3. Create optimistic messages in cache
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          chatId: targetChatId,
          userId: "current-user",
          role: "user",
          content: userMessageContent,
          createdAt: now,
        };

        const assistantMessage: Message = {
          id: `temp-assistant-${Date.now()}`,
          chatId: targetChatId,
          userId: "assistant",
          role: "assistant",
          content: "...",
          createdAt: now,
        };

        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(targetChatId),
          [userMessage, assistantMessage]
        );

        // 4. Add chat to sidebar immediately
        const newChat: Chat = {
          id: targetChatId,
          userId: "current-user",
          title: placeholderTitle,
          createdAt: now,
          updatedAt: now,
        };

        queryClient.setQueryData<Chat[]>(chatQueryKeys.chats(), (oldChats) => {
          if (!oldChats) return [newChat];
          return [newChat, ...oldChats];
        });

        // 5. Navigate to the chat
        navigate(`/app/chat/${targetChatId}`);

        // 6. Create chat in backend (non-blocking)
        createChatMutation
          .mutateAsync({ id: targetChatId, title: placeholderTitle })
          .catch((error) => {
            console.error("Failed to create chat:", error);
            queryClient.removeQueries({
              queryKey: chatQueryKeys.messages(targetChatId),
            });
            queryClient.setQueryData<Chat[]>(
              chatQueryKeys.chats(),
              (oldChats) =>
                oldChats?.filter((chat) => chat.id !== targetChatId) || []
            );
            navigate("/app/chat", { replace: true });
            toast.error("Неуспешно създаване на казуса. Моля, опитайте отново");
            setIsGenerating(false);
          });

        // 7. Send message and stream response
        sendMessage(userMessageContent, targetChatId).catch(() => {
          deleteChatMutation
            .mutateAsync(targetChatId)
            .then(() => navigate("/app/chat", { replace: true }))
            .catch((deleteError) => {
              console.error("Failed to delete orphaned chat:", deleteError);
            });
        });

        return;
      }

      /* EXISTING CHAT FLOW */
      setInput("");
      setIsGenerating(true);

      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        chatId: chatId,
        userId: "current-user",
        role: "user",
        content: userMessageContent,
        createdAt: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        chatId: chatId,
        userId: "assistant",
        role: "assistant",
        content: "...",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        chatQueryKeys.messages(chatId),
        (old) =>
          old
            ? [...old, userMessage, assistantMessage]
            : [userMessage, assistantMessage]
      );

      sendMessage(userMessageContent, chatId);
    },
    [
      input,
      isGenerating,
      isStreaming,
      chatId,
      createChatMutation,
      deleteChatMutation,
      navigate,
      sendMessage,
      isAtLimit,
      isLoadingMessages,
      hasLoadingMessage,
      queryClient,
    ]
  );

  return {
    input,
    setInput,
    isGenerating,
    isStreaming,
    handleSubmit,
  };
}
