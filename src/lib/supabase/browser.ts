import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Browser Supabase Client
 * 
 * For use in Client Components and browser-side code.
 * Handles authentication flows:
 * - signUp
 * - signInWithPassword
 * - signOut
 * - resetPasswordForEmail
 * - updateUser
 * 
 * Uses HTTP-only cookies for session management (configured via middleware).
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

