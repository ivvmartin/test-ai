import "server-only";

import { Content, GoogleGenAI, Type } from "@google/genai";

import { env } from "@/lib/env";
import {
  SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
  buildTitlePrompt,
} from "./prompts";
import type { ChatMessage, QueryAnalysisResult, TokenUsage } from "./types";
import { VAT_ACT_TEXT, VAT_REGULATIONS_TEXT } from "./vat-act";

/**
 * Handles all interactions with Google Gemini AI.
 *
 * SERVER-ONLY - Never import this in client components
 */
class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!env.GOOGLE_GEMINI_API_KEY) {
      throw new Error(
        "GOOGLE_GEMINI_API_KEY is not set. Gemini service cannot be initialized."
      );
    }
    this.ai = new GoogleGenAI({ apiKey: env.GOOGLE_GEMINI_API_KEY });
  }

  /**
   * Step 1: Analyze Query
   *
   * Refines the user's question
   */
  async analyzeQuery(
    currentQuestion: string,
    chatHistory: ChatMessage[]
  ): Promise<QueryAnalysisResult> {
    const startTime = Date.now();
    const modelName = "gemini-3-pro-preview";

    console.log("🤖 [LLM Call - Query Analysis] Starting...");
    console.log("📊 [LLM Config]", {
      model: modelName,
      temperature: 0.1,
      thinkingBudget: 2000,
      responseMimeType: "application/json",
      step: "1 - Query Analysis (Refinement)",
    });

    // 1. Format chat history
    const formattedHistory = chatHistory
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        const label = msg.role === "user" ? "User" : "Assistant";
        return `${label}: ${msg.content}`;
      })
      .join("\n\n");

    // 2. Build analysis prompt
    const prompt = buildAnalysisPrompt(formattedHistory, currentQuestion);

    console.log("📝 [LLM Input]", {
      currentQuestion,
      historyLength: chatHistory.length,
      promptLength: prompt.length,
    });

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 2000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refined_question: { type: Type.STRING },
            },
            required: ["refined_question"],
          },
        },
      });

      const text = response.text?.trim() ?? "";
      const duration = Date.now() - startTime;

      console.log("✅ [LLM Response - Query Analysis] Success");
      console.log("⏱️  [LLM Timing]", { duration: `${duration}ms` });
      console.log("📄 [Raw LLM Response]", {
        textLength: text.length,
        textPreview: text.substring(0, 200),
      });

      const parsed = JSON.parse(text) as { refined_question: string };

      if (!parsed.refined_question) {
        throw new Error("Invalid response structure from Gemini");
      }

      console.log("📤 [LLM Output]", {
        refinedQuestion: parsed.refined_question,
      });

      return { refined_question: parsed.refined_question };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ [LLM Error - Query Analysis]", {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });

      console.log("⚠️  [LLM Fallback] Using original question");
      return { refined_question: currentQuestion };
    }
  }

  /**
   * Generates a concise title for a chat
   */
  async generateTitle(userMessage: string): Promise<string> {
    const startTime = Date.now();
    const modelName = "gemini-2.5-flash";

    console.log("🤖 [LLM Call - Title Generation] Starting...");
    console.log("📝 [Title Input]", { messageLength: userMessage.length });

    const prompt = buildTitlePrompt(userMessage);

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { temperature: 0.6 },
    });

    const rawText = response.text?.trim() ?? "";
    console.log("📄 [Raw Title Response]", { rawText });

    const title = rawText
      .replace(/^["'„"«»\s]+|["'„"«»\s]+$/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const duration = Date.now() - startTime;
    console.log("✅ [LLM Response - Title Generation]", {
      title,
      length: title.length,
      duration: `${duration}ms`,
    });

    return title;
  }

  /**
   * Step 2: Generate Streaming Response
   *
   * Generates a comprehensive legal answer.
   * Prepends the full VAT law text to every request to leverage implicit caching.
   */
  async *generateResponseStream(
    chatHistory: ChatMessage[],
    refinedQuestion: string
  ): AsyncGenerator<{ text?: string; usage?: TokenUsage; done: boolean }> {
    const startTime = Date.now();
    const modelName = "gemini-3-flash-preview";
    const temperature = 0.1;

    console.log("🤖 [LLM Call - Response Generation] Starting...");
    console.log("📊 [LLM Config]", {
      model: modelName,
      temperature,
      step: "2 - Response Generation (Streaming with Full Context)",
      systemInstruction: "SYSTEM_INSTRUCTION (Bulgarian VAT Expert)",
    });

    const contextPrefix = `USE the following current Bulgarian VAT legal framework (ЗДДС and ППЗДДС) effective as of 01.01.2026:\n\n=== ЗДДС (Bulgarian VAT Act) ===\n${VAT_ACT_TEXT}\n\n=== ППЗДДС (Regulations for Application of VAT Act) ===\n${VAT_REGULATIONS_TEXT}\n\n=== USER QUESTION ===\n${refinedQuestion}`;

    // 1. Convert chat history to Gemini Content format
    const contents: Content[] = chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 2. Add the context prefix with refined question as the last user message
    contents.push({
      role: "user",
      parts: [{ text: contextPrefix }],
    });

    console.log("📝 [LLM Input]", {
      historyLength: chatHistory.length,
      contextPrefixLength: contextPrefix.length,
      totalMessages: contents.length,
    });

    try {
      const stream = await this.ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature,
        },
      });

      let chunkCount = 0;
      let totalCharsStreamed = 0;
      let usageMetadata: TokenUsage | null = null;

      // 3. Stream chunks
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          chunkCount++;
          totalCharsStreamed += text.length;
          yield { text, done: false };
        }

        if (chunk.usageMetadata) {
          usageMetadata = {
            promptTokenCount: chunk.usageMetadata.promptTokenCount || 0,
            candidatesTokenCount: chunk.usageMetadata.candidatesTokenCount || 0,
            totalTokenCount: chunk.usageMetadata.totalTokenCount || 0,
          };
        }
      }

      const duration = Date.now() - startTime;

      console.log("✅ [LLM Response - Response Generation] Success");
      console.log("⏱️  [LLM Timing]", { duration: `${duration}ms` });
      console.log("📊 [LLM Streaming Stats]", {
        chunksStreamed: chunkCount,
        totalCharacters: totalCharsStreamed,
        avgChunkSize:
          chunkCount > 0 ? Math.round(totalCharsStreamed / chunkCount) : 0,
      });

      if (usageMetadata) {
        console.log("🎯 [LLM Token Usage]", {
          promptTokens: usageMetadata.promptTokenCount,
          completionTokens: usageMetadata.candidatesTokenCount,
          totalTokens: usageMetadata.totalTokenCount,
          model: modelName,
        });
        yield { usage: usageMetadata, done: true };
      } else {
        console.warn("⚠️  [LLM Warning] No usage metadata available");
        yield { done: true };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ [LLM Error - Response Generation]", {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
