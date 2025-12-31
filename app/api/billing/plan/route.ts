/**
 * GET /api/billing/plan
 *
 * Returns the current user's plan information including usage limits and period
 */

import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { usageService } from "@/lib/usage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireUser();

    // 2. Get usage snapshot which includes plan, limits, and period info
    const snapshot = await usageService.getUsageSnapshot(user.userId);

    // 3. Build response with only essential data
    // Frontend will calculate: used, remaining, percentUsed
    const response = {
      plan: snapshot.planKey,
      monthlyLimit: snapshot.monthlyLimit,
      balance: snapshot.remaining, // Current balance (remaining messages)
      periodStart: snapshot.periodStart.toISOString(),
      periodEnd: snapshot.periodEnd.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
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

    console.error("Billing plan error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch plan information",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
