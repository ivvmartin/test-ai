import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { usageService } from "@/lib/usage/service";
import { LimitExceededError, UsageError } from "@/lib/usage/errors";

/**
 * GET /api/usage/me
 * 
 * Returns the authenticated user's usage snapshot for the current period.
 * 
 * Authentication: Required (HTTP-only cookies)
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "planKey": "FREE",
 *     "monthlyLimit": 10,
 *     "used": 5,
 *     "remaining": 5,
 *     "percentUsed": 50,
 *     "periodKey": "2024-03",
 *     "periodStart": "2024-03-01T00:00:00.000Z",
 *     "periodEnd": "2024-04-01T00:00:00.000Z",
 *     "source": "default_free"
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
 * 
 * Error Response (429):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Monthly usage limit of 10 messages has been reached...",
 *     "code": "LIMIT_EXCEEDED"
 *   }
 * }
 * 
 * Error Response (500):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Internal server error",
 *     "code": "INTERNAL_ERROR"
 *   }
 * }
 */
export async function GET() {
  try {
    // Require authentication
    const user = await requireUser();

    // Get usage snapshot
    const snapshot = await usageService.getUsageSnapshot(user.userId);

    return NextResponse.json({
      success: true,
      data: {
        planKey: snapshot.planKey,
        monthlyLimit: snapshot.monthlyLimit,
        used: snapshot.used,
        remaining: snapshot.remaining,
        percentUsed: snapshot.percentUsed,
        periodKey: snapshot.periodKey,
        periodStart: snapshot.periodStart.toISOString(),
        periodEnd: snapshot.periodEnd.toISOString(),
        source: snapshot.source,
      },
    });
  } catch (error) {
    // Handle authentication errors
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

    // Handle limit exceeded errors
    if (error instanceof LimitExceededError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 429 }
      );
    }

    // Handle usage system errors
    if (error instanceof UsageError) {
      console.error("Usage system error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 500 }
      );
    }

    // Unexpected error
    console.error("Unexpected error in /api/usage/me:", error);
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

