import { NextRequest } from "next/server";

import type { ChatMessage } from "@/lib/ai";
import { geminiService } from "@/lib/ai";
import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { guardrailService, JailbreakAttemptError } from "@/lib/guardrail";
import {
  getClientIp,
  RATE_LIMITS,
  rateLimiter,
  sanitizeUserInput,
} from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { LimitExceededError, usageService } from "@/lib/usage";

/**
 * POST /api/chat/chats/[id]/messages
 *
 * Adds a user message to a chat and generates an AI response.
 * Implements the 3-step AI flow:
 * 0. Guardrail Validation - Check for jailbreak/malicious attempts
 * 1. Query Analysis - Refine question
 * 2. Response Generation - Stream AI response with full VAT context
 *
 * The response generation uses implicit caching by prepending the full
 * ЗДДС and ППЗДДС texts as a prefix to every request.
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
    const { id: chatId } = await params;

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

    // 0. Guardrail Validation
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

    // 1. Verify chat belongs to user
    const { data: chat, error: convError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.userId)
      .single();

    if (convError || !chat) {
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Chat not found",
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

    // 3. Fetch chat history
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching chat history:", messagesError);
      return new Response(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch chat history",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Convert to ChatMessage format
    const chatHistory: ChatMessage[] = (messagesData || []).map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    // 5. Save user message to database
    const { error: userMsgError } = await supabase.from("messages").insert({
      chat_id: chatId,
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

    // 6. Generate AI title if this is the first message (non-blocking)
    if (chatHistory.length === 0) {
      geminiService
        .generateTitle(userMessage)
        .then(async (title) => {
          await supabase
            .from("chats")
            .update({ title })
            .eq("id", chatId)
            .eq("user_id", user.userId);
          console.log("✅ [API] AI-generated title saved:", title);
        })
        .catch((error) => {
          console.error("❌ [API] Failed to generate AI title:", error);
        });
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
              chat_id: chatId,
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
            "🚀 [API] Starting 2-step AI flow (guardrail already passed)..."
          );
          const analysisResult = await geminiService.analyzeQuery(
            userMessage,
            chatHistory
          );

          console.log("📋 [API] Analysis complete:", {
            refinedQuestion: analysisResult.refined_question.substring(0, 100),
          });

          // STEP 2: Generate Response with full VAT context
          console.log(
            "📝 [API] Starting response generation with full VAT context..."
          );

          let fullResponse = "";
          let tokenUsage = null;

          // Pass chatHistory and refined question
          // The service will prepend the full VAT law context for implicit caching
          for await (const chunk of geminiService.generateResponseStream(
            chatHistory,
            analysisResult.refined_question
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
            chat_id: chatId,
            user_id: user.userId,
            role: "assistant",
            content: fullResponse,
            token_count: tokenUsage?.totalTokenCount || null,
          });

          // 9. Consume usage AFTER successful completion
          try {
            await usageService.consumeUsage(user.userId, 1);
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
            chat_id: chatId,
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
      "Unexpected error in POST /api/chat/chats/[id]/messages:",
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
