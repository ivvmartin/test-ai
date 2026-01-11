import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter, RATE_LIMITS, getClientIp } from "@/lib/security";
import { StripeBillingService } from "@/lib/billing";
import { auditLogger } from "@/lib/audit";

/**
 * DELETE /api/account
 *
 * Deletes the authenticated user's account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Require authentication
    const user = await requireUser();
    const userId = user.userId;

    // 2. Apply rate limiting for sensitive account operations
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimiter.check(
      `account-delete:${userId}:${clientIp}`,
      RATE_LIMITS.AUTH.limit,
      RATE_LIMITS.AUTH.windowMs
    );

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
          },
        }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required",
        },
        { status: 400 }
      );
    }

    // 4. Verify password by attempting to sign in
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify user",
        },
        { status: 401 }
      );
    }

    // 5. Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: password,
    });

    if (signInError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
        },
        { status: 403 }
      );
    }

    // 6. Use admin client to delete user data
    const adminClient = createAdminClient();

    // 7. Check for active subscription and cancel it in Stripe
    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 7.1. Log account deletion to audit log BEFORE deletion
    const userAgent = request.headers.get("user-agent") || undefined;
    await auditLogger.logAccountDeletion(
      userId,
      userData.user.email || "unknown",
      clientIp,
      userAgent,
      {
        had_subscription: !!subscription,
        subscription_status: subscription?.status || null,
        stripe_customer_id: subscription?.stripe_customer_id || null,
      }
    );

    if (
      subscription?.stripe_subscription_id &&
      (subscription.status === "active" || subscription.status === "trialing")
    ) {
      try {
        const stripeService = new StripeBillingService();

        // Cancel the subscription immediately in Stripe
        await stripeService.cancelSubscription(
          subscription.stripe_subscription_id
        );
        console.log(
          `Canceled Stripe subscription: ${subscription.stripe_subscription_id}`
        );
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue with account deletion even if Stripe cancellation fails
        // The subscription will be cleaned up via webhook or manual intervention
      }
    }

    // 8. Delete usage counters
    const { error: usageError } = await adminClient
      .from("usage_counters")
      .delete()
      .eq("user_id", userId);

    if (usageError) {
      console.error("Error deleting usage counters:", usageError);
    }

    // 9. Delete subscriptions from database
    const { error: subscriptionError } = await adminClient
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subscriptionError) {
      console.error("Error deleting subscriptions:", subscriptionError);
    }

    // 10. Delete the auth user (this is the final step)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      userId
    );

    if (deleteUserError) {
      console.error("Error deleting user:", deleteUserError);
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to delete account. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    console.error("Unexpected error in /api/account DELETE:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
