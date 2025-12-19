import { create } from "zustand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Simplified User Type
 * 
 * Derived from Supabase User.
 * No tokens stored - Supabase handles session via HTTP-only cookies.
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: SupabaseUser | null) => void;
  clearAuth: () => void;
}

/**
 * Auth Store (Supabase-based)
 * 
 * Minimal store that wraps Supabase session.
 * No token storage - Supabase handles this via HTTP-only cookies.
 * 
 * Usage:
 * ```ts
 * const { user, isAuthenticated } = useAuthStore();
 * ```
 * 
 * To update:
 * ```ts
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * useAuthStore.getState().setUser(user);
 * ```
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (supabaseUser) => {
    if (!supabaseUser) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      name: supabaseUser.user_metadata?.name,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
    };

    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
