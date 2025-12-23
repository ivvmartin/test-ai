import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Auth Callback Route
 *
 * Handles Supabase auth callbacks for:
 * - Email confirmation
 * - Password reset
 *
 * Flow:
 * 1. User clicks link in email (confirmation, password reset)
 * 2. Supabase redirects to this route with auth code
 * 3. Exchange code for session
 * 4. For email confirmations: verify email but sign out user (require manual login)
 * 5. For password resets: keep session and redirect to password reset page
 * 6. Redirect to appropriate page
 *
 * Required Redirect URLs in Supabase Dashboard:
 * - http://localhost:3000/auth/callback
 * - https://<your-domain>/auth/callback
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/app/chat";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      // Redirect to error page or sign-in with error message
      return NextResponse.redirect(
        new URL(
          `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    // 1. Check if this is a password reset flow (has 'next' parameter)
    const isPasswordReset = next && next !== "/app/chat";

    if (isPasswordReset) {
      // 1.1. For password reset: keep session and redirect to reset page
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    // 2. For email confirmation: verify email but require manual login
    // Sign out the user immediately after verification
    await supabase.auth.signOut();

    // 3. Redirect to sign-in with success message
    return NextResponse.redirect(
      new URL("/auth/sign-in?confirmed=true", requestUrl.origin)
    );
  }

  // No code provided - redirect to sign-in
  return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
}
