// src/store/authStore.ts
import { create } from "zustand";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pau_dinner_user", JSON.stringify(user));
      localStorage.setItem("pau_dinner_token", token);
    }
    set({ user, token });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pau_dinner_user");
      localStorage.removeItem("pau_dinner_token");
    }
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token && !!get().user,
}));