// ============================================================================
// CHAT TYPES - Aligned with Backend API
// ============================================================================

export type MessageRole = "user" | "assistant" | "system";

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

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

// ============================================================================
// API REQUEST PAYLOADS
// ============================================================================

export interface CreateConversationRequest {
  title?: string;
}

export interface AddMessageRequest {
  role: MessageRole;
  content: string;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

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

// ============================================================================
// TYPED API RESPONSES
// ============================================================================

export type ConversationResponse = ApiSuccessResponse<Conversation>;
export type ConversationsListResponse = ApiSuccessResponse<Conversation[]>;
export type MessageResponse = ApiSuccessResponse<Message>;
export type MessagesListResponse = ApiSuccessResponse<Message[]>;

// ============================================================================
// CLIENT-SIDE ENRICHED TYPES (with computed fields)
// ============================================================================

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...chatQueryKeys.all, "conversation", id] as const,
  messages: (conversationId: string) =>
    [...chatQueryKeys.all, "messages", conversationId] as const,
};
