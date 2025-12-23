import type {
  Conversation,
  ConversationResponse,
  ConversationsListResponse,
  CreateConversationRequest,
  Message,
  MessagesListResponse,
} from "@/types/chat.types";

/**
 * Creates a new conversation for the authenticated user.
 * Enforces 10-conversation limit on the backend
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
 * Sorted by updatedAt DESC, createdAt DESC, _id DESC
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
 * Messages are sorted by createdAt ASC
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  console.log(
    "🌐 [API] getMessages called for conversation:",
    conversationId,
    "at",
    new Date().toISOString()
  );
  console.trace("🌐 [API] getMessages call stack");

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
  console.log("🌐 [API] getMessages returned:", data.data.length, "messages");
  return data.data;
}

/**
 * Adds a message to a conversation with streaming AI response.
 *
 * This function sends a user message and receives a streaming AI response
 * via Server-Sent Events (SSE)
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
      credentials: "include",
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
          const data = line.slice(6);
          if (!data.trim()) continue;

          try {
            const parsed = JSON.parse(data);
            console.log("📡 [SSE] Received event:", parsed);

            if (parsed.type === "chunk" && parsed.text) {
              callbacks.onChunk(parsed.text);
            } else if (parsed.type === "done") {
              console.log("📡 [SSE] Done event received, calling onDone");
              callbacks.onDone(parsed.usage);
              return;
            } else if (parsed.type === "error") {
              console.log("📡 [SSE] Error event received:", parsed.message);
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
 * Deletes a conversation and all its messages
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
