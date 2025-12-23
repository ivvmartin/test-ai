import { create } from "zustand";

interface AppState {
  aiAvailable: boolean;
  quotaLimit: number;
  quotaUsed: number;
  setAiAvailable: (available: boolean) => void;
  setQuota: (used: number, limit: number) => void;
  incrementQuotaUsed: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  aiAvailable: true,
  quotaLimit: 100,
  quotaUsed: 45,
  setAiAvailable: (available) => set({ aiAvailable: available }),
  setQuota: (used, limit) => set({ quotaUsed: used, quotaLimit: limit }),
  incrementQuotaUsed: () =>
    set((state) => ({
      quotaUsed: Math.min(state.quotaUsed + 1, state.quotaLimit),
    })),
}));
