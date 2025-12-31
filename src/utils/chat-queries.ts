import {
  QueryClient,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth.store";
import type { Conversation, Message } from "@/types/chat.types";
import { chatQueryKeys } from "@/types/chat.types";
import { getConversations, getMessages } from "./chat-api";

/**
 * Fetches the user's most recent 10 conversations
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
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Fetches all messages for a specific conversation
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

/**
 * Prefetches conversations to improve perceived performance
 */
export function prefetchConversations(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: getConversations,
    staleTime: 1000 * 60 * 2,
  });
}
