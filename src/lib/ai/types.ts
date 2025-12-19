// ============================================================================
// AI SERVICE TYPES
// ============================================================================

/**
 * Step 1: Query Analysis Response
 * Gemini analyzes the user's question and conversation history to produce
 * a refined question and search keywords for VAT content retrieval.
 */
export interface QueryAnalysisResult {
  refined_question: string;
  search_keywords: string[];
}

/**
 * VAT Content Source
 */
export type VATSource = "ЗДДС" | "ППЗДДС";

/**
 * VAT Content Item from Database
 */
export interface VATContent {
  id: string;
  source: VATSource;
  article_number: string;
  content: string;
  created_at: string;
}

/**
 * Step 2: Context Retrieval Result
 */
export interface ContextRetrievalResult {
  actContext: string; // Relevant articles from ЗДДС
  regulationsContext: string; // Relevant articles from ППЗДДС
  foundArticles: VATContent[]; // All found articles for reference
}

/**
 * Conversation History Item for Gemini
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Step 3: Streaming Response Chunk
 */
export interface StreamChunk {
  text: string;
  done: boolean;
}

/**
 * Token Usage Metadata
 */
export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

/**
 * Complete AI Response with Metadata
 */
export interface AIResponse {
  content: string;
  usage: TokenUsage;
}

