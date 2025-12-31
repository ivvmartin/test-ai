import { NextRequest } from "next/server";

import type { ConversationMessage } from "@/lib/ai";
import { buildFinalPrompt, geminiService, vatContentService } from "@/lib/ai";
import { generateConversationTitle } from "@/lib/ai/title-generator";
import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { LimitExceededError, usageService } from "@/lib/usage";
import { guardrailService, JailbreakAttemptError } from "@/lib/guardrail";
import {
  rateLimiter,
  RATE_LIMITS,
  getClientIp,
  sanitizeUserInput,
} from "@/lib/security";

/**
 * POST /api/chat/chats/[id]/messages
 *
 * Adds a user message to a chat and generates an AI response.
 * Implements the 4-step AI flow:
 * 0. Guardrail Validation - Check for jailbreak/malicious attempts
 * 1. Query Analysis - Refine question and extract keywords
 * 2. Context Retrieval - Find relevant VAT articles
 * 3. Response Generation - Stream AI response with context
 *
 * Request Body:
 * {
 *   "content": "User's question"
 * }
 *
 * Response: Server-Sent Events (SSE) stream
 *
 * Event types:
 * - data: {"type": "chunk", "text": "..."}
 * - data: {"type": "done", "usage": {...}}
 * - data: {"type": "error", "message": "..."}
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id: conversationId } = await params;

    // Extract IP address securely for rate limiting and logging
    const clientIp = getClientIp(request);

    const rateLimitResult = rateLimiter.check(
      `ai-chat:${user.userId}:${clientIp}`,
      RATE_LIMITS.AI_CHAT.limit,
      RATE_LIMITS.AI_CHAT.windowMs
    );

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.AI_CHAT.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const rawMessage = body.content;

    if (!rawMessage || typeof rawMessage !== "string") {
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Invalid message content",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize user input to prevent XSS and injection attacks
    const sanitizationResult = sanitizeUserInput(rawMessage, 10000);

    if (!sanitizationResult.isValid) {
      console.warn(
        "🚨 [Security] Invalid input detected:",
        sanitizationResult.reason
      );
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Invalid message content. Please check your input.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userMessage = sanitizationResult.sanitized;

    // STEP 0: Guardrail Validation
    // Check for jailbreak/malicious attempts BEFORE any processing
    let isGuardrailBlocked = false;
    try {
      // Use the securely extracted IP address
      await guardrailService.validateQuery(user.userId, userMessage, clientIp);
    } catch (error) {
      if (error instanceof JailbreakAttemptError) {
        console.warn("🚨 [API] Guardrail blocked query for user:", user.userId);
        // Mark as blocked but continue to save the message
        isGuardrailBlocked = true;
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }

    // 1. Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.userId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Conversation not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Check usage limit BEFORE processing (but don't consume yet)
    try {
      await usageService.assertWithinLimit(user.userId);
    } catch (error) {
      if (error instanceof LimitExceededError) {
        return new Response(
          JSON.stringify({
            type: "error",
            message: error.message,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // 3. Fetch conversation history
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching conversation history:", messagesError);
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch conversation history",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Convert to ConversationMessage format
    const conversationHistory: ConversationMessage[] = (messagesData || []).map(
      (msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })
    );

    // 5. Save user message to database
    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.userId,
      role: "user",
      content: userMessage,
    });

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Failed to save message",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Auto-generate title if this is the first message
    if (conversationHistory.length === 0) {
      const title = generateConversationTitle(userMessage);
      await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId)
        .eq("user_id", user.userId);
    }

    // 7. Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If guardrail blocked the message, save a silent error and return
          if (isGuardrailBlocked) {
            console.log(
              "🛡️ [API] Guardrail blocked - saving silent error message"
            );

            const errorMessage =
              "Съжалявам, но не мога да обработя това съобщение.";

            // Save the error message as assistant response
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              user_id: user.userId,
              role: "assistant",
              content: errorMessage,
              token_count: null,
            });

            // Send the error as a complete response
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chunk",
                  text: errorMessage,
                })}\n\n`
              )
            );

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
            );

            controller.close();
            return;
          }

          // STEP 1: Analyze Query
          console.log(
            "🚀 [API] Starting 3-step AI flow (guardrail already passed)..."
          );
          const analysisResult = await geminiService.analyzeQuery(
            userMessage,
            conversationHistory
          );

          console.log("📋 [API] Analysis complete:", {
            refinedQuestion: analysisResult.refined_question.substring(0, 100),
            keywordsCount: analysisResult.search_keywords.length,
            keywords: analysisResult.search_keywords,
          });

          // STEP 2: Retrieve Context
          console.log("🔍 [API] Starting context retrieval...");
          const contextResult = await vatContentService.findRelevantContent(
            analysisResult.search_keywords
          );

          console.log("📊 [API] Context retrieval complete:", {
            hasActContext: !!contextResult.actContext,
            hasRegulationsContext: !!contextResult.regulationsContext,
          });

          // STEP 3: Generate Response (streaming)
          console.log("📝 [API] Building final prompt...");
          const finalPrompt = buildFinalPrompt(
            analysisResult.refined_question,
            contextResult.actContext,
            contextResult.regulationsContext
          );

          let fullResponse = "";
          let tokenUsage = null;

          // Pass conversationHistory without the current message
          // The service will add finalPrompt as the new user message
          for await (const chunk of geminiService.generateResponseStream(
            conversationHistory,
            finalPrompt
          )) {
            if (chunk.text) {
              fullResponse += chunk.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "chunk",
                    text: chunk.text,
                  })}\n\n`
                )
              );
            }

            if (chunk.usage) {
              tokenUsage = chunk.usage;
            }
          }

          // 8. Save assistant response to database
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.userId,
            role: "assistant",
            content: fullResponse,
            token_count: tokenUsage?.totalTokenCount || null,
          });

          // 9. Consume usage AFTER successful completion
          try {
            await usageService.consumeUsage(user.userId, 1, {
              conversationId,
              model: "gemini-2.5-flash",
            });
          } catch (error) {
            console.error(
              "Failed to consume usage after successful response:",
              error
            );
            // Don't fail the request if usage tracking fails
            // The user already got their response
          }

          // 10. Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", usage: tokenUsage })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Error in streaming response:", error);

          // 11. Save error message to database so it persists
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.userId,
            role: "assistant",
            content: "Something went wrong. Please try again",
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "AI generation failed",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          type: "error",
          message: error.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error(
      "Unexpected error in POST /api/chat/conversations/[id]/messages:",
      error
    );
    return new Response(
      JSON.stringify({
        type: "error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
