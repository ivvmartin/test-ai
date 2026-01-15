export interface QueryAnalysisResult {
  refined_question: string;
}

export interface ChatMessage {
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
