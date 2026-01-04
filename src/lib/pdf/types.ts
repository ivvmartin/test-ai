export interface ConversationExport {
  metadata: ConversationExportMetadata;
  messages: MessageExport[];
}

export interface ConversationExportMetadata {
  conversationId: string;
  title: string;
  exportedAt: string; // ISO 8601 string
  locale: string; // e.g., "bg-BG"
}

export interface MessageExport {
  role: "user" | "assistant" | "system";
  content: string; // Markdown content
  createdAt: string; // ISO 8601 string
}

/**
 * Export size limits to prevent abuse and ensure performance
 */
export const EXPORT_LIMITS = {
  MAX_MESSAGES: 100,
  MAX_TOTAL_CHARS: 100_000, // 100k characters total
} as const;
