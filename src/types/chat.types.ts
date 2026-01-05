export type MessageRole = "user" | "assistant" | "system";

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  id?: string;
  title?: string;
}

export interface AddMessageRequest {
  role: MessageRole;
  content: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ConversationResponse = ApiSuccessResponse<Conversation>;
export type ConversationsListResponse = ApiSuccessResponse<Conversation[]>;
export type MessageResponse = ApiSuccessResponse<Message>;
export type MessagesListResponse = ApiSuccessResponse<Message[]>;

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...chatQueryKeys.all, "conversation", id] as const,
  messages: (conversationId: string) =>
    [...chatQueryKeys.all, "messages", conversationId] as const,
};
