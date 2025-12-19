import "server-only";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "./errors";

/**
 * Authenticated User
 */
export interface AuthenticatedUser {
  userId: string;
  email?: string;
}

/**
 * Require Authenticated User
 * 
 * Auth guard helper for protecting API routes and Server Components.
 * 
 * Usage in Route Handler:
 * ```ts
 * export async function GET() {
 *   const user = await requireUser();
 *   // user is authenticated
 *   return Response.json({ userId: user.userId });
 * }
 * ```
 * 
 * Usage in Server Component:
 * ```ts
 * export default async function ProtectedPage() {
 *   const user = await requireUser();
 *   return <div>Hello {user.email}</div>;
 * }
 * ```
 * 
 * @throws {UnauthorizedError} If user is not authenticated (HTTP 401)
 * @returns {Promise<AuthenticatedUser>} Authenticated user data
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

