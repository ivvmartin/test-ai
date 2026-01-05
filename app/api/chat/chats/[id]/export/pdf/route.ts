import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import {
  EXPORT_LIMITS,
  generatePDF,
  type ConversationExport,
  type MessageExport,
} from "@/lib/pdf";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/chat/conversations/[id]/export/pdf
 *
 * Exports a conversation to PDF format
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const user = await requireUser();
    const supabase = await createClient();
    const { id: conversationId } = await params;

    // 2. Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("id", conversationId)
      .eq("user_id", user.userId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Conversation not found",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // 3. Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages for export:", messagesError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to fetch conversation messages",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No messages to export",
            code: "NO_CONTENT",
          },
        },
        { status: 400 }
      );
    }

    // 4. Check size limits
    if (messages.length > EXPORT_LIMITS.MAX_MESSAGES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Conversation has too many messages (${messages.length}). Maximum allowed: ${EXPORT_LIMITS.MAX_MESSAGES}`,
            code: "PAYLOAD_TOO_LARGE",
          },
        },
        { status: 413 }
      );
    }

    const totalChars = messages.reduce(
      (sum, msg) => sum + (msg.content?.length || 0),
      0
    );

    if (totalChars > EXPORT_LIMITS.MAX_TOTAL_CHARS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Conversation content is too large (${totalChars} characters). Maximum allowed: ${EXPORT_LIMITS.MAX_TOTAL_CHARS}`,
            code: "PAYLOAD_TOO_LARGE",
          },
        },
        { status: 413 }
      );
    }

    // 5. Build export data
    const exportData: ConversationExport = {
      metadata: {
        conversationId: conversation.id,
        title: conversation.title || "Нов казус",
        exportedAt: new Date().toISOString(),
        locale: "bg-BG",
      },
      messages: messages.map(
        (msg): MessageExport => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          createdAt: msg.created_at,
        })
      ),
    };

    // 6. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generatePDF(exportData);
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to generate PDF",
            code: "PDF_GENERATION_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // 8. Generate filename
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `case-${conversationId.substring(0, 8)}-${dateStr}.pdf`;

    // 9. Return PDF as downloadable file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    console.error("Unexpected error in PDF export:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "An unexpected error occurred",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
