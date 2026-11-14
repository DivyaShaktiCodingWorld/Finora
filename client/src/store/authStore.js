
import { create } from "zustand";
import authService from "../services/authService";

export const useAuthStore = create((set) => ({
  user: null,
  status: "checking",
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    set({ status: "checking", error: null });

    try {
      const response = await authService.getCurrentUser();

      set({
        user: response.user,
        status: "authenticated",
        error: null,
      });

      return response.user;
    } catch {
      set({
        user: null,
        status: "unauthenticated",
        error: null,
      });

      return null;
    }
  },

  login: async (email, password) => {
    set({ error: null });

    try {
      const response = await authService.login({
        email,
        password,
      });

      set({
        user: response.user,
        status: "authenticated",
        error: null,
      });

      return response;
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to sign in.";

      set({
        error: message,
        status: "unauthenticated",
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({ error: null });

    try {
      const response = await authService.register(payload);

      set({
        user: response.user,
        status: "authenticated",
        error: null,
      });

      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create your account.";

      set({
        error: message,
        status: "unauthenticated",
      });

      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        status: "unauthenticated",
        error: null,
      });
    }
  },
}));
