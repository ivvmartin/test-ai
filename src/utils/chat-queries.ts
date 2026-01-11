import {
  QueryClient,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth.store";
import type { Chat, Message } from "@/types/chat.types";
import { chatQueryKeys } from "@/types/chat.types";
import { getChats, getMessages } from "./chat-api";

/**
 * Fetches the user's most recent 25 chats
 */
export function useChatsQuery(
  options?: Omit<UseQueryOptions<Chat[], Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Chat[], Error>({
    queryKey: chatQueryKeys.chats(),
    queryFn: getChats,
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Fetches all messages for a specific chat.
 * If cache has optimistic messages (temp- prefix), skips initial fetch.
 */
export function useMessagesQuery(
  chatId: string | undefined,
  options?: Omit<UseQueryOptions<Message[], Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  return useQuery<Message[], Error>({
    queryKey: chatQueryKeys.messages(chatId ?? ""),
    queryFn: async ({ queryKey }) => {
      if (!chatId) {
        throw new Error("Chat ID is required");
      }

      // Check if we have optimistic data (messages with temp- IDs)
      // If so, return that data instead of fetching from server
      const existingData = queryClient.getQueryData<Message[]>(queryKey);
      if (
        existingData &&
        existingData.some((msg) => msg.id.startsWith("temp-"))
      ) {
        return existingData;
      }

      return getMessages(chatId);
    },
    enabled: isAuthenticated && !!chatId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Prefetches chats to improve perceived performance
 */
export function prefetchChats(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: chatQueryKeys.chats(),
    queryFn: getChats,
    staleTime: 1000 * 60 * 2,
  });
}
