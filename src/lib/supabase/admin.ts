import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Admin Supabase Client (Secret Key)
 * 
 * SERVER-ONLY. Never import this in client components.
 * 
 * Uses the Secret key (replaces legacy "service role" key).
 * Bypasses Row Level Security (RLS) policies.
 * 
 * Use for:
 * - Admin operations
 * - User management (delete users, update metadata)
 * - Privileged database operations
 * 
 * Key format: sb_secret_...
 */
export function createAdminClient() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Admin client cannot be created."
    );
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

