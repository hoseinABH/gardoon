"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/api/types";
import { clearAuthTokens, setAuthTokens } from "@/lib/api/client";

export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

interface AuthState {
  user: UserProfile | null;
  demoMode: boolean;
  hydrated: boolean;
  setSession: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  setDemoUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  setHydrated: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      demoMode: false,
      hydrated: false,
      setSession: (user, accessToken, refreshToken) => {
        setAuthTokens(accessToken, refreshToken);
        set({ user, demoMode: false });
      },
      setDemoUser: (user) => {
        clearAuthTokens();
        set({ user, demoMode: true });
      },
      updateUser: (user) => set({ user }),
      setHydrated: () => set({ hydrated: true }),
      logout: () => {
        clearAuthTokens();
        set({ user: null, demoMode: false });
      },
    }),
    {
      name: "gardoon-auth-storage",
      partialize: (state) => ({
        user: state.user,
        demoMode: state.demoMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
