import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth Callback Route
 * 
 * Handles Supabase auth callbacks for:
 * - Email confirmation
 * - Password reset
 * - Magic link sign-in
 * - OAuth redirects
 * 
 * Flow:
 * 1. User clicks link in email (confirmation, password reset, etc.)
 * 2. Supabase redirects to this route with auth code
 * 3. Exchange code for session
 * 4. Set session cookies
 * 5. Redirect to appropriate page
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
        new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // Successfully authenticated - redirect to next page
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // No code provided - redirect to sign-in
  return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
}

