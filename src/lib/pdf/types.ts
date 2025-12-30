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

export interface PDFGenerationOptions {
  format?: "A4" | "Letter";
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
}

export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  format: "A4",
  margin: {
    top: "15mm",
    right: "12mm",
    bottom: "15mm",
    left: "12mm",
  },
  displayHeaderFooter: false,
  printBackground: true,
};

/**
 * Export size limits to prevent abuse and ensure performance
 */
export const EXPORT_LIMITS = {
  MAX_MESSAGES: 100,
  MAX_TOTAL_CHARS: 100_000, // 100k characters total
} as const;
