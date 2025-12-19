import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  addMessage,
  addMessageWithStreaming,
  createConversation,
  deleteConversation,
} from "./chat-api";
import { chatQueryKeys } from "@/types/chat.types";
import type {
  AddMessageRequest,
  Conversation,
  CreateConversationRequest,
  Message,
} from "@/types/chat.types";
import { usageKeys } from "./usage-queries";
import { useState, useCallback } from "react";

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Checks if an error is a limit exceeded error (HTTP 429)
 */
export function isLimitExceededError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check if error message contains status 429 or limit-related keywords
    return (
      error.message.includes("429") ||
      error.message.toLowerCase().includes("limit exceeded") ||
      error.message.toLowerCase().includes("usage limit")
    );
  }
  return false;
}

/**
 * Extracts limit exceeded message from error response
 */
export function getLimitExceededMessage(error: unknown): string {
  if (error instanceof Error) {
    // If the error message already contains a meaningful message, return it
    if (
      error.message.toLowerCase().includes("limit") ||
      error.message.toLowerCase().includes("usage")
    ) {
      return error.message;
    }
  }
  return "Monthly usage limit reached. Upgrade your plan or wait for the next billing period.";
}

// ============================================================================
// CREATE CONVERSATION MUTATION
// ============================================================================

interface CreateConversationMutationOptions
  extends Omit<
    UseMutationOptions<Conversation, Error, CreateConversationRequest>,
    "mutationFn"
  > {}

/**
 * Creates a new conversation.
 * Automatically invalidates conversations list after success.
 */
export function useCreateConversationMutation(
  options?: CreateConversationMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation<Conversation, Error, CreateConversationRequest>({
    mutationFn: createConversation,
    onSuccess: (data) => {
      // Optimistically add the new conversation to the cache immediately
      queryClient.setQueryData<Conversation[]>(
        chatQueryKeys.conversations(),
        (oldConversations) => {
          if (!oldConversations) return [data];
          // Add to the beginning (most recent)
          return [data, ...oldConversations];
        }
      );

      // Set initial empty messages array for the new conversation
      queryClient.setQueryData<Message[]>(chatQueryKeys.messages(data.id), []);

      // Invalidate to ensure we have the latest from server
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
    ...(options as any),
  });
}

// ============================================================================
// ADD MESSAGE MUTATION
// ============================================================================

interface AddMessageMutationVariables {
  conversationId: string;
  payload: AddMessageRequest;
}

interface AddMessageMutationOptions
  extends Omit<
    UseMutationOptions<Message, Error, AddMessageMutationVariables>,
    "mutationFn"
  > {}

/**
 * Adds a message to a conversation.
 * Uses optimistic updates for immediate UI feedback.
 * Invalidates conversations list (to update recency order).
 */
export function useAddMessageMutation(options?: AddMessageMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, AddMessageMutationVariables>({
    mutationFn: ({ conversationId, payload }) =>
      addMessage(conversationId, payload),

    // Optimistic update: immediately add message to cache
    onMutate: async ({ conversationId, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatQueryKeys.messages(conversationId),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<Message[]>(
        chatQueryKeys.messages(conversationId)
      );

      // Optimistically update messages with temporary ID
      if (previousMessages) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          userId: "current-user", // This will be replaced by server response
          role: payload.role,
          content: payload.content,
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(conversationId),
          [...previousMessages, optimisticMessage]
        );
      }

      // Return context for rollback
      return { previousMessages, conversationId };
    },

    // On error: rollback to previous state
    onError: (_error, _variables, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(context.conversationId),
          context.previousMessages
        );
      }
    },

    // On success: replace optimistic message with server response
    onSuccess: (data, variables) => {
      const { conversationId } = variables;

      // Update messages with actual server response
      queryClient.setQueryData<Message[]>(
        chatQueryKeys.messages(conversationId),
        (old) => {
          if (!old) return [data];
          return [...old, data];
        }
      );

      // Invalidate conversations to update recency order
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });

      // Invalidate usage snapshot to reflect consumed usage
      queryClient.invalidateQueries({
        queryKey: usageKeys.snapshot(),
      });
    },

    // Always refetch after settled
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.messages(variables.conversationId),
      });
    },

    ...(options as any),
  });
}

// ============================================================================
// DELETE CONVERSATION MUTATION (Future)
// ============================================================================

interface DeleteConversationMutationOptions
  extends Omit<UseMutationOptions<void, Error, string>, "mutationFn"> {}

/**
 * Delete conversation mutation.
 * Removes conversation and all its messages (cascade).
 */
export function useDeleteConversationMutation(
  options?: DeleteConversationMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteConversation,
    onSuccess: (data, conversationId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: chatQueryKeys.messages(conversationId),
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.conversations(),
      });
    },
    ...(options as any),
  });
}

// ============================================================================
// STREAMING MESSAGE HOOK (NEW AI FLOW)
// ============================================================================

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
 * Hook for sending messages with streaming AI responses.
 *
 * This replaces the old useAddMessageMutation for the new AI chat system.
 * It handles:
 * - Sending user message
 * - Receiving streaming AI response
 * - Optimistic UI updates
 * - Cache invalidation
 *
 * Usage:
 * ```tsx
 * const { sendMessage, isStreaming, streamedText, error } = useStreamingMessage(conversationId);
 *
 * await sendMessage("What is VAT?");
 * // streamedText will update in real-time as AI responds
 * ```
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

      // Reset state
      setState({
        isStreaming: true,
        streamedText: "",
        error: null,
      });

      // Optimistically add user message to cache
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        conversationId: targetConversationId,
        userId: "current-user",
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        chatQueryKeys.messages(targetConversationId),
        (old) => (old ? [...old, userMessage] : [userMessage])
      );

      // Optimistically add empty assistant message
      const assistantMessageId = `temp-assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        conversationId: targetConversationId,
        userId: "assistant",
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        chatQueryKeys.messages(targetConversationId),
        (old) => (old ? [...old, assistantMessage] : [assistantMessage])
      );

      try {
        await addMessageWithStreaming(targetConversationId, content, {
          onChunk: (text) => {
            setState((prev) => ({
              ...prev,
              streamedText: prev.streamedText + text,
            }));

            // Update assistant message in cache with accumulated text
            queryClient.setQueryData<Message[]>(
              chatQueryKeys.messages(targetConversationId),
              (old) => {
                if (!old) return old;
                return old.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + text }
                    : msg
                );
              }
            );
          },
          onDone: (usage) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }));

            // Invalidate queries to get final server state
            queryClient.invalidateQueries({
              queryKey: chatQueryKeys.messages(targetConversationId),
            });
            queryClient.invalidateQueries({
              queryKey: chatQueryKeys.conversations(),
            });
            queryClient.invalidateQueries({
              queryKey: usageKeys.snapshot(),
            });

            options?.onComplete?.();
          },
          onError: (error) => {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error,
            }));

            // Remove optimistic messages on error
            queryClient.setQueryData<Message[]>(
              chatQueryKeys.messages(targetConversationId),
              (old) => {
                if (!old) return old;
                return old.filter(
                  (msg) =>
                    msg.id !== userMessage.id && msg.id !== assistantMessageId
                );
              }
            );

            options?.onError?.(error);
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage,
        }));

        // Remove optimistic messages on error
        queryClient.setQueryData<Message[]>(
          chatQueryKeys.messages(targetConversationId),
          (old) => {
            if (!old) return old;
            return old.filter(
              (msg) =>
                msg.id !== userMessage.id && msg.id !== assistantMessageId
            );
          }
        );

        options?.onError?.(errorMessage);
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
