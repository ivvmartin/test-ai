import { z } from "zod";

/**
 * Environment Variable Schema
 *
 * Validates required environment variables at runtime.
 * Uses Supabase's new key model (Publishable + Secret keys).
 */
const envSchema = z.object({
  // Public variables (safe for browser)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),

  // Server-only variables (NEVER exposed to browser)
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),

  // Stripe (server-only)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().min(1).optional(),

  // Stripe URLs (optional, with defaults)
  BILLING_CHECKOUT_SUCCESS_PATH: z.string().default("/billing/success"),
  BILLING_CHECKOUT_CANCEL_PATH: z.string().default("/billing/cancel"),
  BILLING_PORTAL_RETURN_PATH: z.string().default("/app/billing"),

  // Google Gemini AI (server-only)
  GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
});

/**
 * Client-safe environment variables
 * Can be imported in both client and server components
 */
const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

/**
 * Server-only environment variables
 * Import this in server-only code
 */
const serverEnv = {
  ...clientEnv,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  BILLING_CHECKOUT_SUCCESS_PATH: process.env.BILLING_CHECKOUT_SUCCESS_PATH,
  BILLING_CHECKOUT_CANCEL_PATH: process.env.BILLING_CHECKOUT_CANCEL_PATH,
  BILLING_PORTAL_RETURN_PATH: process.env.BILLING_PORTAL_RETURN_PATH,
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
};

// Validate on module load
const parsed = envSchema.safeParse(serverEnv);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

/**
 * Validated environment variables
 * Use this in client components and browser code
 */
export const env = parsed.data;

/**
 * Type-safe environment access
 */
export type Env = z.infer<typeof envSchema>;
