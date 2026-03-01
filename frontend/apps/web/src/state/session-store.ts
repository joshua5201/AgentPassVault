import { create } from "zustand";
import type { LoginResponse } from "@agentpassvault/sdk";

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
}

interface SessionState extends TokenState {
  isAuthenticated: boolean;
  adminName: string;
  login: (username: string) => void;
  setLoginSession: (username: string, loginResponse: LoginResponse) => void;
  shouldRefreshToken: () => boolean;
  logout: () => void;
}

const TOKEN_REFRESH_BUFFER_SECONDS = 60;

const initialTokenState: TokenState = {
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialTokenState,
  isAuthenticated: false,
  adminName: "Admin User",
  login: (username) =>
    set({
      isAuthenticated: true,
      adminName: username.trim() || "Admin User",
    }),
  setLoginSession: (username, loginResponse) => {
    const now = Date.now();

    set({
      isAuthenticated: true,
      adminName: username.trim() || "Admin User",
      accessToken: loginResponse.accessToken ?? null,
      refreshToken: loginResponse.refreshToken ?? null,
      accessTokenExpiresAt:
        typeof loginResponse.expiresIn === "number"
          ? now + loginResponse.expiresIn * 1000
          : null,
      refreshTokenExpiresAt:
        typeof loginResponse.refreshTokenExpiresIn === "number"
          ? now + loginResponse.refreshTokenExpiresIn * 1000
          : null,
    });
  },
  shouldRefreshToken: () => {
    const state = get();

    if (!state.accessTokenExpiresAt) {
      return false;
    }

    return Date.now() >= state.accessTokenExpiresAt - TOKEN_REFRESH_BUFFER_SECONDS * 1000;
  },
  logout: () =>
    set({
      ...initialTokenState,
      isAuthenticated: false,
    }),
}));
