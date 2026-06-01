import { create } from "zustand";
import { api } from "../lib/api";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("edukanban.token"),
  loading: false,
  error: null,
  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem("edukanban.token", token);
      set({ token, user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Не удалось войти", loading: false });
    }
  },
  async bootstrap() {
    const token = localStorage.getItem("edukanban.token");
    if (!token) return;
    set({ loading: true, token });
    try {
      const { user } = await api.me();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem("edukanban.token");
      set({ user: null, token: null, loading: false });
    }
  },
  logout() {
    localStorage.removeItem("edukanban.token");
    set({ user: null, token: null });
  }
}));
