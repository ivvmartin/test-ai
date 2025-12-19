/**
 * API Client for External Backend
 *
 * NOTE: This client is currently deprecated for most use cases.
 * The chat API has been migrated to use Next.js API routes with fetch.
 *
 * This client may still be used by legacy code or external backend integrations.
 * If you need to integrate with an external backend, update this client to include
 * Supabase session tokens for authentication.
 *
 * For new API integrations, prefer using fetch directly with Next.js API routes.
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Axios instance for external backend API calls
 *
 * WARNING: This client does NOT include authentication.
 * You need to update it to include Supabase session tokens.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

/**
 * Legacy export for compatibility
 * @deprecated Use `api` instead
 */
export const apiClient = api;

/**
 * TODO: Add request interceptor to include Supabase session token
 *
 * Example implementation:
 *
 * import { createClient } from "@/lib/supabase/browser";
 *
 * api.interceptors.request.use(async (config) => {
 *   const supabase = createClient();
 *   const { data: { session } } = await supabase.auth.getSession();
 *
 *   if (session?.access_token) {
 *     config.headers.Authorization = `Bearer ${session.access_token}`;
 *   }
 *
 *   return config;
 * });
 */

/**
 * TODO: Add response interceptor for error handling
 *
 * Example implementation:
 *
 * api.interceptors.response.use(
 *   (response) => response,
 *   async (error) => {
 *     if (error.response?.status === 401) {
 *       // Handle unauthorized - redirect to sign in
 *       window.location.href = '/auth/sign-in';
 *     }
 *     return Promise.reject(error);
 *   }
 * );
 */
