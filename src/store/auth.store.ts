import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuthenticated: (authenticated: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

/**
 * Auth Store (Supabase-based)
 *
 * Manages only authentication state (isAuthenticated, isInitialized).
 * For user data (email, userId, plan), use the useUserIdentity hook from usage-queries.ts
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitialized: false,

  setAuthenticated: (authenticated) => {
    set({ isAuthenticated: authenticated });
  },

  setInitialized: (initialized) => {
    set({ isInitialized: initialized });
  },

  clearAuth: () => {
    set({ isAuthenticated: false });
  },
}));
