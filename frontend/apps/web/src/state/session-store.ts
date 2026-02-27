import { create } from "zustand";

interface SessionState {
  isAuthenticated: boolean;
  adminName: string;
  login: (username: string) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  adminName: "Admin User",
  login: (username) =>
    set({
      isAuthenticated: true,
      adminName: username.trim() || "Admin User",
    }),
  logout: () => set({ isAuthenticated: false }),
}));
