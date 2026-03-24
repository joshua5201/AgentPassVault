import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MasterKeys } from "@agentpassvault/sdk";
import App from "./App";
import { useSessionStore } from "./state/session-store";
import { useVaultKeyStore } from "./security";

const mockMasterKeys = {
  encKey: {} as CryptoKey,
  macKey: {} as CryptoKey,
} satisfies MasterKeys;

const { appApiClientMock, createMockDevSessionMock, navigateMock } = vi.hoisted(() => ({
  appApiClientMock: {
    setAccessToken: vi.fn(),
    login: vi.fn(),
  },
  createMockDevSessionMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("./api/client", () => ({
  appApiClient: appApiClientMock,
}));

vi.mock("./config/env", () => ({
  readAppEnv: () => ({
    apiUrl: "https://localhost:5173",
    configuredApiUrl: null,
    apiMockingEnabled: true,
    apiClientFallbackEnabled: false,
    apiProxyEnabled: false,
    erudaEnabled: false,
  }),
}));

vi.mock("./app/router", () => ({
  useHashRouter: () => ({
    match: { route: "requests", params: {} },
    navigate: navigateMock,
  }),
}));

vi.mock("./hooks/use-vault-lock-manager", () => ({
  useVaultLockManager: vi.fn(),
}));

vi.mock("./security/mock-dev-session", () => ({
  createMockDevSession: createMockDevSessionMock,
}));

vi.mock("./components/layout/AppShell", () => ({
  AppShell: ({
    adminName,
    children,
    onLogout,
  }: {
    adminName: string;
    children: ReactNode;
    onLogout: () => void;
  }) => (
    <div>
      <div>Signed in as {adminName}</div>
      <button type="button" onClick={onLogout}>
        Logout
      </button>
      {children}
    </div>
  ),
}));

vi.mock("./pages/RequestsPage", () => ({
  RequestsPage: () => <h1>Requests</h1>,
}));

vi.mock("./pages/LoginPage", () => ({
  LoginPage: () => <div>Login</div>,
}));

vi.mock("./pages/RequestDetailPage", () => ({
  RequestDetailPage: () => <div>Request Detail</div>,
}));

vi.mock("./pages/SecretDetailPage", () => ({
  SecretDetailPage: () => <div>Secret Detail</div>,
}));

vi.mock("./pages/SecretsPage", () => ({
  SecretsPage: () => <div>Secrets</div>,
}));

vi.mock("./pages/SettingsPage", () => ({
  SettingsPage: () => <div>Settings</div>,
}));

vi.mock("./pages/UiLabPage", () => ({
  UiLabPage: () => <div>Ui Lab</div>,
}));

vi.mock("./pages/VaultUnlockPage", () => ({
  VaultUnlockPage: () => <div>Vault Unlock</div>,
}));

vi.mock("./pages/FulfillmentPage", () => ({
  FulfillmentPage: () => <div>Fulfillment</div>,
}));

describe("App mocked dev bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useSessionStore.setState({
      isAuthenticated: false,
      adminName: "Admin User",
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    });
    useVaultKeyStore.setState({
      masterKeys: null,
      loginHash: null,
      lastActivityAt: null,
      vaultUnlockedAt: null,
      isLocked: true,
    });
    createMockDevSessionMock.mockResolvedValue({
      username: "vault-admin+mock@agentpassvault.local",
      loginHash: "mock-login-hash",
      masterKeys: mockMasterKeys,
      loginResponse: {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
        expiresIn: 86400,
        refreshTokenExpiresIn: 86400,
      },
    });
  });

  it("bootstraps a mock session without calling the login API path", async () => {
    render(<App />);

    await screen.findByText("Signed in as vault-admin+mock@agentpassvault.local");
    await screen.findByRole("heading", { name: "Requests" });

    expect(createMockDevSessionMock).toHaveBeenCalledTimes(1);
    expect(appApiClientMock.login).not.toHaveBeenCalled();
    expect(appApiClientMock.setAccessToken).toHaveBeenCalledWith("mock-access-token");
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useSessionStore.getState().adminName).toBe("vault-admin+mock@agentpassvault.local");
    expect(useVaultKeyStore.getState().loginHash).toBe("mock-login-hash");
    expect(useVaultKeyStore.getState().masterKeys).toEqual(mockMasterKeys);
  });

  it("keeps logout on the mock bootstrap path", async () => {
    render(<App />);

    await screen.findByText("Signed in as vault-admin+mock@agentpassvault.local");
    await screen.getByRole("button", { name: "Logout" }).click();

    await waitFor(() => {
      expect(createMockDevSessionMock).toHaveBeenCalledTimes(2);
    });
    expect(appApiClientMock.login).not.toHaveBeenCalled();
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useVaultKeyStore.getState().loginHash).toBe("mock-login-hash");
  });
});
