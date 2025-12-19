import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { UnauthorizedError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/account
 *
 * Deletes the authenticated user's account and all associated data.
 * This action is irreversible.
 *
 * Authentication: Required (HTTP-only cookies)
 *
 * Request Body:
 * {
 *   "password": "user's password for confirmation"
 * }
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 *
 * Error Response (401):
 * {
 *   "success": false,
 *   "error": "Authentication required"
 * }
 *
 * Error Response (403):
 * {
 *   "success": false,
 *   "error": "Invalid password"
 * }
 *
 * Error Response (500):
 * {
 *   "success": false,
 *   "error": "Failed to delete account"
 * }
 */
export async function DELETE(request: Request) {
  try {
    // Require authentication
    const user = await requireUser();
    const userId = user.userId;

    // Parse request body
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

    // Verify password by attempting to sign in
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

    // Verify password
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

    // Use admin client to delete user data
    const adminClient = createAdminClient();

    // Delete user data from Supabase tables
    // Note: Conversations and messages are stored in external backend (NEXT_PUBLIC_API_BASE_URL)
    // If the external backend is active, you should add API calls here to delete:
    // - All conversations for this user
    // - All messages for this user
    // Example:
    // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    // await fetch(`${apiBaseUrl}/chat/conversations?userId=${userId}`, { method: 'DELETE' });
    //
    // For now, we only delete data stored in Supabase

    // 1. Delete usage counters
    const { error: usageError } = await adminClient
      .from("usage_counters")
      .delete()
      .eq("user_id", userId);

    if (usageError) {
      console.error("Error deleting usage counters:", usageError);
      // Continue with deletion even if this fails
    }

    // 2. Delete subscriptions
    const { error: subscriptionError } = await adminClient
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subscriptionError) {
      console.error("Error deleting subscriptions:", subscriptionError);
      // Continue with deletion even if this fails
    }

    // 3. Delete profiles (if exists)
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Continue with deletion even if this fails
    }

    // 4. Delete the auth user (this is the final step)
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
