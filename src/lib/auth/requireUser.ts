import "server-only";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "./errors";

export interface AuthenticatedUser {
  userId: string;
  email?: string;
}

/**
 * Require Authenticated User
 *
 * Auth guard helper for protecting API routes and Server Components
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required");
  }

  return {
    userId: user.id,
    email: user.email,
  };
}
