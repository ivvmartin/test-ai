import { create } from "zustand";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setUser: (user: SupabaseUser | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

/**
 * Auth Store (Supabase-based)
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

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

  setInitialized: (initialized) => {
    set({ isInitialized: initialized });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
