import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { usageService } from "@/lib/usage";

/**
 * GET /api/me
 *
 * Returns the authenticated user's information.
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "uuid",
 *     "email": "user@example.com",
 *     "plan": "TRIAL" | "PAID" | "FREE_INTERNAL" | "INTERNAL",
 *     "createdAt": "2025-01-05T12:00:00.000Z"
 *   }
 * }
 *
 * Error Response (401):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Authentication required",
 *     "code": "UNAUTHORIZED"
 *   }
 * }
 */
export async function GET() {
  try {
    const user = await requireUser();

    const entitlement = await usageService.resolveEntitlement(user.userId);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        plan: entitlement.planKey,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 401 }
      );
    }

    console.error("Unexpected error in /api/me:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
