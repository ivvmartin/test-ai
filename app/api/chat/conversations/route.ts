import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/conversations
 *
 * Returns the authenticated user's conversations (up to 10 most recent).
 *
 * Authentication: Required (HTTP-only cookies)
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "userId": "uuid",
 *       "title": "Conversation title",
 *       "createdAt": "2025-01-01T00:00:00.000Z",
 *       "updatedAt": "2025-01-01T00:00:00.000Z"
 *     }
 *   ]
 * }
 */
export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to fetch conversations",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const conversations = (data || []).map((conv) => ({
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: conversations,
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

    console.error("Unexpected error in GET /api/chat/conversations:", error);
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
 * POST /api/chat/conversations
 *
 * Creates a new conversation for the authenticated user.
 *
 * Request Body:
 * {
 *   "title": "Optional conversation title"
 * }
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "title": "Optional title",
 *     "createdAt": "2025-01-01T00:00:00.000Z",
 *     "updatedAt": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const body = await request.json();
    const title = body.title || null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.userId,
        title,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to create conversation",
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

    return NextResponse.json(
      {
        success: true,
        data: conversation,
      },
      { status: 201 }
    );
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

    console.error("Unexpected error in POST /api/chat/conversations:", error);
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
