import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { sanitizeText } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/chat/chats
 *
 * Returns the authenticated user's chats (up to 25 most recent)
 */
export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(25);

    if (error) {
      console.error("Error fetching chats:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to fetch chats",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const chats = (data || []).map((conv) => ({
      id: conv.id,
      userId: conv.user_id,
      title: conv.title,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: chats,
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

    console.error("Unexpected error in GET /api/chat/chats:", error);
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
 * POST /api/chat/chats
 *
 * Creates a new chat for the authenticated user.
 *
 * Request Body:
 * {
 *   "id": "Client-generated UUID for immediate UI transitions",
 *   "title": "Optional chat title"
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
    const clientId = body.id;
    const rawTitle = body.title || null;

    // 1. Validate client-provided ID if present (must be valid UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (clientId && !uuidRegex.test(clientId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid chat ID format",
            code: "INVALID_ID",
          },
        },
        { status: 400 }
      );
    }

    // 2. Sanitize title if provided
    const title = rawTitle ? sanitizeText(rawTitle, 200) : null;

    // 3. Build insert object with client-provided ID
    const insertData: { user_id: string; title: string | null; id?: string } = {
      user_id: user.userId,
      title,
    };
    if (clientId) {
      insertData.id = clientId;
    }

    const { data, error } = await supabase
      .from("chats")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating chat:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to create chat",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    const chat = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(
      {
        success: true,
        data: chat,
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

    console.error("Unexpected error in POST /api/chat/chats:", error);
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
