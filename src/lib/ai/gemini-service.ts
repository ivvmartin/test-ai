import "server-only";

import { Content, GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import { env } from "@/lib/env";
import {
  SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
  buildTitlePrompt,
} from "./prompts";
import type { ChatMessage, QueryAnalysisResult, TokenUsage } from "./types";

/**
 * Handles all interactions with Google Gemini AI for the Bulgarian VAT
 * legal consultation system.
 *
 * SERVER-ONLY - Never import this in client components.
 */
class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!env.GOOGLE_GEMINI_API_KEY) {
      throw new Error(
        "GOOGLE_GEMINI_API_KEY is not set. Gemini service cannot be initialized."
      );
    }
    this.genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY);
  }

  /**
   * Step 1: Analyze Query
   *
   * Analyzes the user's question in the context of chat history
   * to produce a refined question and search keywords
   */
  async analyzeQuery(
    currentQuestion: string,
    chatHistory: ChatMessage[]
  ): Promise<QueryAnalysisResult> {
    const startTime = Date.now();
    const modelName = "gemini-2.5-flash";
    const temperature = 0.1;

    console.log("🤖 [LLM Call - Query Analysis] Starting...");
    console.log("📊 [LLM Config]", {
      model: modelName,
      temperature,
      responseMimeType: "application/json",
      step: "1 - Query Analysis",
    });

    // 1. Format chat history
    const formattedHistory = chatHistory
      .filter((msg) => msg.role !== "system") // Exclude system messages
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

    // 3. Configure model for analysis with strict schema
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            refined_question: {
              type: SchemaType.STRING,
              description:
                "The refined, more precise question in Bulgarian, considering the whole chat.",
            },
            search_keywords: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.STRING,
              },
              description:
                "A list of keywords in Bulgarian for searching the legal text, based on the latest question and context.",
            },
          },
          required: ["refined_question", "search_keywords"],
        },
      },
    });

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;

      const duration = Date.now() - startTime;

      console.log("✅ [LLM Response - Query Analysis] Success");
      console.log("⏱️  [LLM Timing]", {
        duration: `${duration}ms`,
        step: "Query Analysis",
      });
      console.log("🎯 [LLM Token Usage]", {
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
        model: modelName,
      });

      console.log("📄 [Raw LLM Response]", {
        textLength: text.length,
        textPreview: text.substring(0, 200),
      });

      let parsed: QueryAnalysisResult;
      try {
        parsed = JSON.parse(text) as QueryAnalysisResult;
      } catch (parseError) {
        console.error("❌ [JSON Parse Error]", {
          error:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
          rawText: text,
        });
        throw new Error("Failed to parse JSON response from Gemini");
      }

      // 4. Validate response structure
      if (!parsed.refined_question || !Array.isArray(parsed.search_keywords)) {
        console.error("❌ [Invalid Response Structure]", {
          hasRefinedQuestion: !!parsed.refined_question,
          hasSearchKeywords: !!parsed.search_keywords,
          isArray: Array.isArray(parsed.search_keywords),
          parsed,
        });
        throw new Error("Invalid response structure from Gemini");
      }

      console.log("📤 [LLM Output]", {
        refinedQuestion: parsed.refined_question,
        keywordsCount: parsed.search_keywords.length,
        keywords: parsed.search_keywords,
      });

      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ [LLM Error - Query Analysis]", {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });

      // 5. Fallback: Use original question and extract keywords
      const keywords = currentQuestion
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);

      console.log(
        "⚠️  [LLM Fallback] Using original question and basic keyword extraction"
      );

      return {
        refined_question: currentQuestion,
        search_keywords: keywords,
      };
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

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.6,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text();

    console.log("📄 [Raw Title Response]", { rawText });

    const title = rawText
      .trim()
      .replace(/^["'„"«»\s]+|["'„"«»\s]+$/g, "") // Remove quotes
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
   * Step 3: Generate Streaming Response
   *
   * Generates a comprehensive legal answer using the retrieved context
   * and chat history. Streams the response in real-time
   */
  async *generateResponseStream(
    chatHistory: ChatMessage[],
    finalPrompt: string
  ): AsyncGenerator<{ text?: string; usage?: TokenUsage; done: boolean }> {
    const startTime = Date.now();
    const modelName = "gemini-2.5-flash";
    const temperature = 0;
    const topK = 1;
    const topP = 1;

    console.log("🤖 [LLM Call - Response Generation] Starting...");
    console.log("📊 [LLM Config]", {
      model: modelName,
      temperature,
      topK,
      topP,
      step: "3 - Response Generation (Streaming)",
      systemInstruction: "SYSTEM_INSTRUCTION (Bulgarian VAT Expert)",
    });

    // 1. Convert chat history to Gemini Content format
    const contents: Content[] = chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 2. Add the final prompt as the last user message
    contents.push({
      role: "user",
      parts: [{ text: finalPrompt }],
    });

    console.log("📝 [LLM Input]", {
      historyLength: chatHistory.length,
      finalPromptLength: finalPrompt.length,
      totalMessages: contents.length,
    });

    // 3. Configure model for response generation
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature,
        topK,
        topP,
      },
    });

    try {
      const result = await model.generateContentStream({ contents });

      let chunkCount = 0;
      let totalCharsStreamed = 0;

      // 4. Stream chunks
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          chunkCount++;
          totalCharsStreamed += text.length;
          yield { text, done: false };
        }
      }

      // 5. Get final response with usage metadata
      const finalResponse = await result.response;
      const usage = finalResponse.usageMetadata;

      const duration = Date.now() - startTime;

      console.log("✅ [LLM Response - Response Generation] Success");
      console.log("⏱️  [LLM Timing]", {
        duration: `${duration}ms`,
        step: "Response Generation",
      });
      console.log("📊 [LLM Streaming Stats]", {
        chunksStreamed: chunkCount,
        totalCharacters: totalCharsStreamed,
        avgChunkSize:
          chunkCount > 0 ? Math.round(totalCharsStreamed / chunkCount) : 0,
      });

      if (usage) {
        console.log("🎯 [LLM Token Usage]", {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
          model: modelName,
        });

        yield {
          usage: {
            promptTokenCount: usage.promptTokenCount || 0,
            candidatesTokenCount: usage.candidatesTokenCount || 0,
            totalTokenCount: usage.totalTokenCount || 0,
          },
          done: true,
        };
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

// Export singleton instance
export const geminiService = new GeminiService();
