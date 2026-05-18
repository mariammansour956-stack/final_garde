import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;

  login: (tokens: { access_token: string; refresh_token: string }, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setTokens: (tokens: { access_token: string; refresh_token: string }) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,

  login: (tokens, user) => {
    localStorage.setItem("accessToken", tokens.access_token);
    localStorage.setItem("refreshToken", tokens.refresh_token);
    localStorage.setItem("user", JSON.stringify(user));
    set({
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
      isAdmin: user.role === "admin",
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    window.location.href = "/login";
  },

  updateUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAdmin: user.role === "admin" });
  },

  setTokens: (tokens) => {
    localStorage.setItem("accessToken", tokens.access_token);
    localStorage.setItem("refreshToken", tokens.refresh_token);
    set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");
    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdmin: user.role === "admin",
        });
      } catch {
        get().logout();
      }
    }
  },
}));
