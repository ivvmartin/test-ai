/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

import type { Chat, CreateChatRequest, Message } from "@/types/chat.types";
import { chatQueryKeys } from "@/types/chat.types";
import {
  addMessageWithStreaming,
  createChat,
  deleteChat,
  exportChatToPdf,
} from "./chat-api";
import { usageKeys } from "./usage-queries";

export function isLimitExceededError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("429") ||
      error.message.toLowerCase().includes("limit exceeded") ||
      error.message.toLowerCase().includes("usage limit")
    );
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CreateChatMutationOptions
  extends Omit<
    UseMutationOptions<Chat, Error, CreateChatRequest>,
    "mutationFn"
  > {}

/**
 * Creates a new chat
 * Note: Optimistic messages are pre-populated in chat.tsx handleSubmit before this mutation runs
 */
export function useCreateChatMutation(options?: CreateChatMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<Chat, Error, CreateChatRequest>({
    mutationFn: createChat,
    onSuccess: (data) => {
      // Add chat to sidebar list
      queryClient.setQueryData<Chat[]>(chatQueryKeys.chats(), (oldChats) => {
        if (!oldChats) return [data];
        // Check if already exists (from optimistic update)
        if (oldChats.some((conv) => conv.id === data.id)) {
          return oldChats;
        }
        // Add to the beginning (most recent)
        return [data, ...oldChats];
      });

      // Don't overwrite messages cache - it already has optimistic messages from handleSubmit

      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.chats(),
      });
    },
    ...(options as any),
  });
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DeleteChatMutationOptions
  extends Omit<UseMutationOptions<void, Error, string>, "mutationFn"> {}

/**
 * Delete chat mutation
 */
export function useDeleteChatMutation(options?: DeleteChatMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previousChats: Chat[] | undefined }
  >({
    mutationFn: deleteChat,
    onMutate: async (chatId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatQueryKeys.chats(),
      });

      // Snapshot the previous value for rollback
      const previousChats = queryClient.getQueryData<Chat[]>(
        chatQueryKeys.chats()
      );

      // Optimistically remove the chat from the list immediately
      queryClient.setQueryData<Chat[]>(chatQueryKeys.chats(), (oldChats) => {
        if (!oldChats) return [];
        return oldChats.filter((chat) => chat.id !== chatId);
      });

      return { previousChats };
    },
    onError: (_err, _chatId, context) => {
      // Rollback to previous state if deletion fails
      if (context?.previousChats) {
        queryClient.setQueryData<Chat[]>(
          chatQueryKeys.chats(),
          context.previousChats
        );
      }
    },
    onSuccess: (_data, chatId) => {
      // Remove messages cache for this chat
      queryClient.removeQueries({
        queryKey: chatQueryKeys.messages(chatId),
      });
    },
    ...(options as any),
  });
}
interface StreamingMessageState {
  isStreaming: boolean;
  error: string | null;
}

interface UseStreamingMessageOptions {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for sending messages with streaming AI responses
 */
export function useStreamingMessage(
  chatId: string | undefined,
  options?: UseStreamingMessageOptions
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamingMessageState>({
    isStreaming: false,
    error: null,
  });

  const sendMessage = useCallback(
    async (content: string, overrideChatId?: string) => {
      const targetChatId = overrideChatId || chatId;

      if (!targetChatId) {
        const error = "No chat ID provided";
        setState((prev) => ({ ...prev, error }));
        options?.onError?.(error);
        return;
      }

      // Reset state and set streaming immediately
      setState({
        isStreaming: true,
        error: null,
      });

      // Accumulate all text without updating UI (show all at once when done)
      let accumulatedText = "";

      await addMessageWithStreaming(targetChatId, content, {
        onChunk: (text) => {
          // Just accumulate text, don't update UI yet
          accumulatedText += text;
        },
        onDone: async (usage) => {
          console.log("🟢 [onDone] Called with usage:", usage);

          // Update UI with complete accumulated text all at once
          if (accumulatedText) {
            queryClient.setQueryData<Message[]>(
              chatQueryKeys.messages(targetChatId),
              (old) => {
                if (!old || old.length === 0) return old;

                // Find the last assistant message and replace "..." with complete text
                const lastAssistantIndex = old.reduce(
                  (lastIdx, msg, idx) =>
                    msg.role === "assistant" ? idx : lastIdx,
                  -1
                );

                if (lastAssistantIndex === -1) return old;

                return old.map((msg, idx) => {
                  if (idx === lastAssistantIndex) {
                    return { ...msg, content: accumulatedText };
                  }
                  return msg;
                });
              }
            );
          }

          setState((prev) => ({
            ...prev,
            isStreaming: false,
          }));

          console.log("🟢 [onDone] About to refetch queries in background...");

          // Refetch in background without showing loading states
          await Promise.all([
            queryClient.refetchQueries({
              queryKey: chatQueryKeys.messages(targetChatId),
              type: "active",
            }),
            queryClient.refetchQueries({
              queryKey: chatQueryKeys.chats(),
              type: "active",
            }),
            queryClient.refetchQueries({
              queryKey: usageKeys.snapshot(),
              type: "active",
            }),
          ]);

          console.log("🟢 [onDone] Background refetch complete");

          options?.onComplete?.();
        },
        onError: async (error) => {
          console.log("🔴 [SSE onError] Error occurred:", error);

          await queryClient.cancelQueries({
            queryKey: chatQueryKeys.messages(targetChatId),
          });

          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error,
          }));

          queryClient.setQueryData<Message[]>(
            chatQueryKeys.messages(targetChatId),
            (old) => {
              if (!old || old.length === 0) {
                console.warn(
                  "🔴 [SSE onError] Cache was cleared! Recreating messages..."
                );
                const userMessage: Message = {
                  id: `temp-user-${Date.now()}`,
                  chatId: targetChatId,
                  userId: "current-user",
                  role: "user",
                  content,
                  createdAt: new Date().toISOString(),
                };
                const assistantMessage: Message = {
                  id: `temp-assistant-${Date.now()}`,
                  chatId: targetChatId,
                  userId: "assistant",
                  role: "assistant",
                  content: "Нещо се обърка. Моля, опитайте отново",
                  createdAt: new Date().toISOString(),
                };
                return [userMessage, assistantMessage];
              }

              // Update the last assistant message with error text
              const lastAssistantIndex = old.reduce(
                (lastIdx, msg, idx) =>
                  msg.role === "assistant" ? idx : lastIdx,
                -1
              );

              return old.map((msg, idx) =>
                idx === lastAssistantIndex
                  ? {
                      ...msg,
                      content: "Нещо се обърка. Моля, опитайте отново",
                    }
                  : msg
              );
            }
          );

          options?.onError?.(error);

          // Throw error so it can be caught by the caller
          throw new Error(error);
        },
      });
    },
    [chatId, queryClient, options]
  );

  return {
    sendMessage,
    isStreaming: state.isStreaming,
    error: state.error,
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ExportChatMutationOptions
  extends Omit<
    UseMutationOptions<{ blob: Blob; filename: string }, Error, string>,
    "mutationFn"
  > {}

/**
 * Export chat to PDF mutation
 */
export function useExportChatMutation(options?: ExportChatMutationOptions) {
  return useMutation<{ blob: Blob; filename: string }, Error, string>({
    mutationFn: exportChatToPdf,
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    ...(options as any),
  });
}
