/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useCallback, useState } from "react";

import type {
  Conversation,
  CreateConversationRequest,
  Message,
} from "@/types/chat.types";
import { chatQueryKeys } from "@/types/chat.types";
import {
  addMessageWithStreaming,
  createConversation,
  deleteConversation,
  exportConversationToPdf,
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
interface CreateConversationMutationOptions
  extends Omit<
    UseMutationOptions<Conversation, Error, CreateConversationRequest>,
    "mutationFn"
  > {}

/**
 * Creates a new conversation
 */
export function useCreateConversationMutation(
  options?: CreateConversationMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation<Conversation, Error, CreateConversationRequest>({
    mutationFn: createConversation,
    onSuccess: (data) => {
      queryClient.setQueryData<Conversation[]>(
        chatQueryKeys.conversations(),
        (oldConversations) => {
          if (!oldConversations) return [data];
          // Add to the beginning (most recent)
          return [data, ...oldConversations];
        }
      );

      queryClient.setQueryData<Message[]>(chatQueryKeys.messages(data.id), []);

      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
    ...(options as any),
  });
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DeleteConversationMutationOptions
  extends Omit<UseMutationOptions<void, Error, string>, "mutationFn"> {}

/**
 * Delete conversation mutation
 */
export function useDeleteConversationMutation(
  options?: DeleteConversationMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previousConversations: Conversation[] | undefined }
  >({
    mutationFn: deleteConversation,
    onMutate: async (conversationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatQueryKeys.conversations(),
      });

      // Snapshot the previous value for rollback
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        chatQueryKeys.conversations()
      );

      // Optimistically remove the conversation from the list immediately
      queryClient.setQueryData<Conversation[]>(
        chatQueryKeys.conversations(),
        (oldConversations) => {
          if (!oldConversations) return [];
          return oldConversations.filter((conv) => conv.id !== conversationId);
        }
      );

      return { previousConversations };
    },
    onError: (_err, _conversationId, context) => {
      // Rollback to previous state if deletion fails
      if (context?.previousConversations) {
        queryClient.setQueryData<Conversation[]>(
          chatQueryKeys.conversations(),
          context.previousConversations
        );
      }
    },
    onSuccess: (_data, conversationId) => {
      // Remove messages cache for this conversation
      queryClient.removeQueries({
        queryKey: chatQueryKeys.messages(conversationId),
      });
    },
    ...(options as any),
  });
}
interface StreamingMessageState {
  isStreaming: boolean;
  streamedText: string;
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
  conversationId: string | undefined,
  options?: UseStreamingMessageOptions
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamingMessageState>({
    isStreaming: false,
    streamedText: "",
    error: null,
  });

  const sendMessage = useCallback(
    async (content: string, overrideConversationId?: string) => {
      const targetConversationId = overrideConversationId || conversationId;

      if (!targetConversationId) {
        const error = "No conversation ID provided";
        setState((prev) => ({ ...prev, error }));
        options?.onError?.(error);
        return;
      }

      // Reset state and set streaming immediately
      setState({
        isStreaming: true,
        streamedText: "",
        error: null,
      });

      // For new conversations, add optimistic messages here
      // (existing conversations already have them added in handleSubmit)
      if (overrideConversationId && overrideConversationId !== conversationId) {
        const userMessage: Message = {
          id: `temp-user-${Date.now()}`,
          conversationId: targetConversationId,
          userId: "current-user",
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        };

        const assistantMessageId = `temp-assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          conversationId: targetConversationId,
          userId: "assistant",
          role: "assistant",
          content: "...",
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(targetConversationId),
          (old) => {
            const updated = old
              ? [...old, userMessage, assistantMessage]
              : [userMessage, assistantMessage];
            return updated;
          }
        );
      }

      const assistantMessageId = `temp-assistant-${Date.now()}`;

      try {
        await addMessageWithStreaming(targetConversationId, content, {
          onChunk: (text) => {
            setState((prev) => ({
              ...prev,
              streamedText: prev.streamedText + text,
            }));

            queryClient.setQueryData<Message[]>(
              chatQueryKeys.messages(targetConversationId),
              (old) => {
                if (!old || old.length === 0) {
                  console.warn(
                    "🟡 [onChunk] Cache was cleared! Recreating messages with loading state..."
                  );
                  const userMessage: Message = {
                    id: `temp-user-${Date.now()}`,
                    conversationId: targetConversationId,
                    userId: "current-user",
                    role: "user",
                    content,
                    createdAt: new Date().toISOString(),
                  };
                  const assistantMessage: Message = {
                    id: assistantMessageId,
                    conversationId: targetConversationId,
                    userId: "assistant",
                    role: "assistant",
                    content: "...", // Show loading indicator
                    createdAt: new Date().toISOString(),
                  };
                  return [userMessage, assistantMessage];
                }

                return old.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    const currentContent =
                      msg.content === "..." ? "" : msg.content;
                    return { ...msg, content: currentContent + text };
                  }
                  return msg;
                });
              }
            );
          },
          onDone: async (usage) => {
            console.log("🟢 [onDone] Called with usage:", usage);

            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }));

            console.log(
              "🟢 [onDone] About to refetch queries in background..."
            );

            // Refetch in background without showing loading states
            await Promise.all([
              queryClient.refetchQueries({
                queryKey: chatQueryKeys.messages(targetConversationId),
                type: "active",
              }),
              queryClient.refetchQueries({
                queryKey: chatQueryKeys.conversations(),
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
              queryKey: chatQueryKeys.messages(targetConversationId),
            });

            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error,
            }));

            queryClient.setQueryData<Message[]>(
              chatQueryKeys.messages(targetConversationId),
              (old) => {
                if (!old || old.length === 0) {
                  console.warn(
                    "🔴 [SSE onError] Cache was cleared! Recreating messages..."
                  );
                  const userMessage: Message = {
                    id: `temp-user-${Date.now()}`,
                    conversationId: targetConversationId,
                    userId: "current-user",
                    role: "user",
                    content,
                    createdAt: new Date().toISOString(),
                  };
                  const assistantMessage: Message = {
                    id: assistantMessageId,
                    conversationId: targetConversationId,
                    userId: "assistant",
                    role: "assistant",
                    content: "Нещо се обърка. Моля, опитайте отново",
                    createdAt: new Date().toISOString(),
                  };
                  return [userMessage, assistantMessage];
                }

                // Update the assistant message with error text
                const updated = old.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: "Нещо се обърка. Моля, опитайте отново",
                      }
                    : msg
                );

                return updated;
              }
            );

            options?.onError?.(error);

            // Throw error so it can be caught by the caller
            throw new Error(error);
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        console.log("🔴 [Catch Block] Error caught:", errorMessage);

        await queryClient.cancelQueries({
          queryKey: chatQueryKeys.messages(targetConversationId),
        });

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));

        // Update assistant message to show error immediately
        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(targetConversationId),
          (old) => {
            if (!old || old.length === 0) {
              console.warn(
                "🔴 [Catch Block] Cache was cleared! Recreating messages..."
              );
              const userMessage: Message = {
                id: `temp-user-${Date.now()}`,
                conversationId: targetConversationId,
                userId: "current-user",
                role: "user",
                content,
                createdAt: new Date().toISOString(),
              };
              const assistantMessage: Message = {
                id: assistantMessageId,
                conversationId: targetConversationId,
                userId: "assistant",
                role: "assistant",
                content: "Нещо се обърка. Моля, опитайте отново",
                createdAt: new Date().toISOString(),
              };
              return [userMessage, assistantMessage];
            }

            const updated = old.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: "Нещо се обърка. Моля, опитайте отново" }
                : msg
            );

            return updated;
          }
        );

        options?.onError?.(errorMessage);

        // Re-throw error so it can be caught by the caller
        throw error;
      }
    },
    [conversationId, queryClient, options]
  );

  return {
    sendMessage,
    isStreaming: state.isStreaming,
    streamedText: state.streamedText,
    error: state.error,
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ExportConversationMutationOptions
  extends Omit<
    UseMutationOptions<{ blob: Blob; filename: string }, Error, string>,
    "mutationFn"
  > {}

/**
 * Export conversation to PDF mutation
 * Automatically triggers download on success
 */
export function useExportConversationMutation(
  options?: ExportConversationMutationOptions
) {
  return useMutation<{ blob: Blob; filename: string }, Error, string>({
    mutationFn: exportConversationToPdf,
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
