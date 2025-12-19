import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getConversations, getMessages } from "./chat-api";
import { chatQueryKeys } from "@/types/chat.types";
import type { Conversation, Message } from "@/types/chat.types";
import { useAuthStore } from "@/store/auth.store";

// ============================================================================
// CONVERSATIONS QUERY
// ============================================================================

/**
 * Fetches the user's most recent 10 conversations.
 * Automatically refetches when the user navigates back to the app.
 */
export function useConversationsQuery(
  options?: Omit<UseQueryOptions<Conversation[], Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Conversation[], Error>({
    queryKey: chatQueryKeys.conversations(),
    queryFn: getConversations,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: "always",
    ...options,
  });
}

// ============================================================================
// MESSAGES QUERY
// ============================================================================

/**
 * Fetches all messages for a specific conversation.
 * Only runs when conversationId is provided and user is authenticated.
 */
export function useMessagesQuery(
  conversationId: string | undefined,
  options?: Omit<UseQueryOptions<Message[], Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Message[], Error>({
    queryKey: chatQueryKeys.messages(conversationId ?? ""),
    queryFn: () => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return getMessages(conversationId);
    },
    enabled: isAuthenticated && !!conversationId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    ...options,
  });
}

// ============================================================================
// HELPER: Prefetch conversations
// ============================================================================

/**
 * Prefetches conversations to improve perceived performance.
 * Call this before navigating to the chat page.
 */
export function prefetchConversations(queryClient: any) {
  return queryClient.prefetchQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: getConversations,
    staleTime: 1000 * 60 * 2,
  });
}
