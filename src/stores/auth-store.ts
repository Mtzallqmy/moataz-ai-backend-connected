import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient } from "@/lib/api/client";
import type { User } from "@/types";

/**
 * Authentication store
 *
 * This store manages the currently authenticated user, JWT token and
 * loading states. This implementation uses real calls to the backend API. The backend
 * exposes `/api/auth/login` and `/api/auth/register` endpoints which
 * return a token and user object on success. The token is stored in
 * the persisted state and automatically attached to all API calls via
 * the apiClient.
 */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      /**
       * Sign in with email and password.
       * On success the backend returns a token and user record.
       */
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const resp = await apiClient.post<{ token: string; user: User }>("/api/auth/login", { email, password });
          set({
            user: resp.user,
            token: resp.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { ok: true };
        } catch (err: any) {
          set({ isLoading: false });
          const msg = err?.message ?? "Login failed";
          return { ok: false, error: msg };
        }
      },

      /**
       * Register a new account.
       * On success automatically logs the user in.
       */
      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const resp = await apiClient.post<{ token: string; user: User }>("/api/auth/register", { name, email, password });
          set({
            user: resp.user,
            token: resp.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { ok: true };
        } catch (err: any) {
          set({ isLoading: false });
          const msg = err?.message ?? "Registration failed";
          return { ok: false, error: msg };
        }
      },

      /**
       * Log out the current user. Clears the token and user state.
       */
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      /**
       * Update the user object in the store locally. This does not
       * persist changes to the backend; if you need to persist updates
       * you should call an appropriate API endpoint first.
       */
      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates, updatedAt: new Date().toISOString() } : null,
        }));
      },

      /**
       * Set the loading state manually.
       */
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "moataz-auth",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage))),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    },
  ),
);
