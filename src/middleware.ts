import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware for Supabase Session Refresh
 *
 * Refreshes Supabase session cookies on every request.
 *
 * The middleware:
 * 1. Reads session cookies from the request
 * 2. Refreshes the session if needed
 * 3. Writes updated cookies to the response
 * 4. Allows the request to proceed
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if needed
  // This will automatically update cookies via the setAll callback
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Matcher Configuration
 *
 * Run middleware on all routes EXCEPT:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon and other public files
 * - Stripe webhook endpoint (needs raw body for signature verification)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - /api/billing/webhook (Stripe webhook - needs raw body)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/billing/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
