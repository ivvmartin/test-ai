import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/conversations/[id]
 *
 * Returns all messages for a specific conversation.
 *
 * Authentication: Required (HTTP-only cookies)
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "conversationId": "uuid",
 *       "userId": "uuid",
 *       "role": "user",
 *       "content": "Message content",
 *       "tokenCount": 100,
 *       "createdAt": "2025-01-01T00:00:00.000Z"
 *     }
 *   ]
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id } = await params;

    // First, verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
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

    // Fetch messages
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to fetch messages",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const messages = (data || []).map((msg) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      userId: msg.user_id,
      role: msg.role,
      content: msg.content,
      tokenCount: msg.token_count,
      createdAt: msg.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: messages,
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

    console.error(
      "Unexpected error in GET /api/chat/conversations/[id]:",
      error
    );
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

/**
 * PATCH /api/chat/conversations/[id]
 *
 * Updates a conversation's title.
 *
 * Request Body:
 * {
 *   "title": "New conversation title"
 * }
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "title": "New title",
 *     "createdAt": "2025-01-01T00:00:00.000Z",
 *     "updatedAt": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id } = await params;

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Title is required and must be a string",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Update conversation title
    const { data, error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id)
      .eq("user_id", user.userId)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating conversation:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to update conversation",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const conversation = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: conversation,
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

    console.error(
      "Unexpected error in PATCH /api/chat/conversations/[id]:",
      error
    );
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

/**
 * DELETE /api/chat/conversations/[id]
 *
 * Deletes a specific conversation and all its messages (cascade).
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Conversation deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id } = await params;

    // Delete conversation (messages will be deleted via CASCADE)
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.userId);

    if (error) {
      console.error("Error deleting conversation:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to delete conversation",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
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

    console.error(
      "Unexpected error in DELETE /api/chat/conversations/[id]:",
      error
    );
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
