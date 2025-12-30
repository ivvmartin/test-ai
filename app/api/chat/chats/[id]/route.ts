import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/chats/[id]
 *
 * Returns all messages for a specific chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id } = await params;

    // 1. First, verify the conversation belongs to the user
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

    // 2. Fetch messages
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

    // 3. Transform to camelCase
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

    console.error("Unexpected error in GET /api/chat/chats/[id]:", error);
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
 * PATCH /api/chat/chats/[id]
 *
 * Updates a chat's title
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

    console.error("Unexpected error in PATCH /api/chat/chats/[id]:", error);
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
 * DELETE /api/chat/chats/[id]
 *
 * Deletes a specific chat and all its messages (cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { id } = await params;

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

    console.error("Unexpected error in DELETE /api/chat/chats/[id]:", error);
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
