import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/account
 *
 * Deletes the authenticated user's account and all associated data
 */
export async function DELETE(request: Request) {
  try {
    // 1. Require authentication
    const user = await requireUser();
    const userId = user.userId;

    // 2. Parse request body
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

    // 3. Verify password by attempting to sign in
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

    // 4. Verify password
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

    // 5. Use admin client to delete user data
    const adminClient = createAdminClient();

    // 6. Delete usage counters
    const { error: usageError } = await adminClient
      .from("usage_counters")
      .delete()
      .eq("user_id", userId);

    if (usageError) {
      console.error("Error deleting usage counters:", usageError);
    }

    // 7. Delete subscriptions
    const { error: subscriptionError } = await adminClient
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subscriptionError) {
      console.error("Error deleting subscriptions:", subscriptionError);
    }

    // 8. Delete the auth user (this is the final step)
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
