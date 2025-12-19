import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";

/**
 * GET /api/me
 * 
 * Example protected API route.
 * Returns the authenticated user's information.
 * 
 * Authentication: Required (HTTP-only cookies)
 * 
 * Success Response (200):
 * {
 *   "userId": "uuid",
 *   "email": "user@example.com"
 * }
 * 
 * Error Response (401):
 * {
 *   "error": "Authentication required"
 * }
 */
export async function GET() {
  try {
    const user = await requireUser();

    return NextResponse.json({
      userId: user.userId,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Unexpected error
    console.error("Unexpected error in /api/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

