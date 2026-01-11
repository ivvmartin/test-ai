import apiClient from "@/lib/axios";
import type {
  Chat,
  ChatResponse,
  ChatsListResponse,
  CreateChatRequest,
  Message,
  MessagesListResponse,
} from "@/types/chat.types";

/**
 * Creates a new chat for the authenticated user.
 * Enforces 25-chat limit on the backend
 */
export async function createChat(
  payload: CreateChatRequest = {}
): Promise<Chat> {
  const response = await apiClient.post<ChatResponse>("/chat/chats", payload);
  return response.data.data;
}

/**
 * Retrieves the user's most recent 25 chats.
 * Sorted by updatedAt DESC, createdAt DESC, _id DESC
 */
export async function getChats(): Promise<Chat[]> {
  const response = await apiClient.get<ChatsListResponse>("/chat/chats");
  return response.data.data;
}

/**
 * Retrieves all messages for a specific chat.
 * Messages are sorted by createdAt ASC
 */
export async function getMessages(chatId: string): Promise<Message[]> {
  console.log(
    "🌐 [API] getMessages called for chat:",
    chatId,
    "at",
    new Date().toISOString()
  );
  console.trace("🌐 [API] getMessages call stack");

  const response = await apiClient.get<MessagesListResponse>(
    `/chat/chats/${chatId}`
  );

  console.log(
    "🌐 [API] getMessages returned:",
    response.data.data.length,
    "messages"
  );
  return response.data.data;
}

/**
 * Adds a message to a chat with streaming AI response.
 *
 * This function sends a user message and receives a streaming AI response
 * via Server-Sent Events (SSE)
 *
 * NOTE: Uses fetch instead of axios because axios doesn't handle SSE streaming well
 */
export async function addMessageWithStreaming(
  chatId: string,
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
  const response = await fetch(`/api/chat/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retryMessage = retryAfter
        ? `Моля, изчакайте ${retryAfter} секунди преди да опитате отново`
        : "Моля, изчакайте малко преди да опитате отново";

      callbacks.onError(`Твърде много заявки. ${retryMessage}`);
      return;
    }

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
 * Deletes a chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<void> {
  await apiClient.delete(`/chat/chats/${chatId}`);
}

/**
 * Exports a chat to PDF format
 * Returns the PDF blob and suggested filename
 */
export async function exportChatToPdf(
  chatId: string
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiClient.post(
    `/chat/chats/${chatId}/export/pdf`,
    {},
    {
      responseType: "blob",
    }
  );

  // Get the PDF blob from response
  const blob = response.data;

  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers["content-disposition"];
  let filename = `chat-${chatId.substring(0, 8)}-${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }

  return { blob, filename };
}
