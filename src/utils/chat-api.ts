import type {
  AddMessageRequest,
  Conversation,
  ConversationResponse,
  ConversationsListResponse,
  CreateConversationRequest,
  Message,
  MessageResponse,
  MessagesListResponse,
} from "@/types/chat.types";

// ============================================================================
// CHAT API ENDPOINTS
// ============================================================================

// ============================================================================
// CONVERSATIONS API
// ============================================================================

/**
 * Creates a new conversation for the authenticated user.
 * Enforces 10-conversation limit on the backend.
 */
export async function createConversation(
  payload: CreateConversationRequest = {}
): Promise<Conversation> {
  const response = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error! status: ${response.status}`
    );
  }

  const data: ConversationResponse = await response.json();
  return data.data;
}

/**
 * Retrieves the user's most recent 10 conversations.
 * Sorted by updatedAt DESC, createdAt DESC, _id DESC.
 */
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch("/api/chat/conversations", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error! status: ${response.status}`
    );
  }

  const data: ConversationsListResponse = await response.json();
  return data.data;
}

/**
 * Retrieves all messages for a specific conversation.
 * Messages are sorted by createdAt ASC.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/conversations/${conversationId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error! status: ${response.status}`
    );
  }

  const data: MessagesListResponse = await response.json();
  return data.data;
}

/**
 * Adds a message to a conversation with streaming AI response.
 *
 * This function sends a user message and receives a streaming AI response
 * via Server-Sent Events (SSE).
 *
 * @param conversationId - The conversation ID
 * @param content - The user's message content
 * @param onChunk - Callback for each text chunk received
 * @param onDone - Callback when streaming is complete (with usage metadata)
 * @param onError - Callback for errors
 */
export async function addMessageWithStreaming(
  conversationId: string,
  content: string,
  callbacks: {
    onChunk: (text: string) => void;
    onDone: (usage?: {
      promptTokenCount: number;
      candidatesTokenCount: number;
      totalTokenCount: number;
    }) => void;
    onError: (error: string) => void;
  }
): Promise<void> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      credentials: "include", // Include cookies for authentication
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    callbacks.onError(
      errorData.message || `HTTP error! status: ${response.status}`
    );
    return;
  }

  if (!response.body) {
    callbacks.onError("No response body");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix
          if (!data.trim()) continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "chunk" && parsed.text) {
              callbacks.onChunk(parsed.text);
            } else if (parsed.type === "done") {
              callbacks.onDone(parsed.usage);
              return;
            } else if (parsed.type === "error") {
              callbacks.onError(parsed.message || "Unknown error");
              return;
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error.message : "Streaming error"
    );
  } finally {
    reader.releaseLock();
  }
}

/**
 * DEPRECATED: Old non-streaming message API.
 * Use addMessageWithStreaming instead for AI responses.
 *
 * This is kept for backwards compatibility but should not be used
 * for the new AI chat system.
 */
export async function addMessage(
  conversationId: string,
  payload: AddMessageRequest
): Promise<Message> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error! status: ${response.status}`
    );
  }

  const data: MessageResponse = await response.json();
  return data.data;
}

// ============================================================================
// HELPER: Delete conversation
// ============================================================================

/**
 * Deletes a conversation and all its messages.
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const response = await fetch(`/api/chat/conversations/${conversationId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `HTTP error! status: ${response.status}`
    );
  }
}
