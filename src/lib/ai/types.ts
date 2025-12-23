export interface QueryAnalysisResult {
  refined_question: string;
  search_keywords: string[];
}

export type VATSource = "ЗДДС" | "ППЗДДС";

export interface VATContent {
  id: string;
  source: VATSource;
  article_number: string;
  content: string;
  created_at: string;
}

export interface ContextRetrievalResult {
  actContext: string; // Relevant articles from ЗДДС
  regulationsContext: string; // Relevant articles from ППЗДДС
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface AIResponse {
  content: string;
  usage: TokenUsage;
}
