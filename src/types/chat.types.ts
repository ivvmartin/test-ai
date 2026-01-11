export type MessageRole = "user" | "assistant" | "system";

export interface Chat {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface CreateChatRequest {
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

export type ChatResponse = ApiSuccessResponse<Chat>;
export type ChatsListResponse = ApiSuccessResponse<Chat[]>;
export type MessageResponse = ApiSuccessResponse<Message>;
export type MessagesListResponse = ApiSuccessResponse<Message[]>;

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export const chatQueryKeys = {
  all: ["chat"] as const,
  chats: () => [...chatQueryKeys.all, "chats"] as const,
  chat: (id: string) => [...chatQueryKeys.all, "chat", id] as const,
  messages: (chatId: string) =>
    [...chatQueryKeys.all, "messages", chatId] as const,
};
