import type { LoginResponse } from "@agentpassvault/sdk";
import { AuthCryptoOrchestrator } from "./auth-crypto-orchestrator";

export const MOCK_DEV_USERNAME = "vault-admin+mock@agentpassvault.local";
export const MOCK_DEV_PASSWORD = "MockMasterPass!2026#LocalOnly";

export interface MockDevSession {
  username: string;
  loginHash: string;
  masterKeys: Awaited<ReturnType<typeof AuthCryptoOrchestrator.deriveForLogin>>["masterKeys"];
  loginResponse: LoginResponse;
}

export async function createMockDevSession(): Promise<MockDevSession> {
  const { username, loginHash, masterKeys } = await AuthCryptoOrchestrator.deriveForLogin(
    MOCK_DEV_USERNAME,
    MOCK_DEV_PASSWORD,
  );

  return {
    username,
    loginHash,
    masterKeys,
    loginResponse: {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenType: "Bearer",
      expiresIn: 24 * 60 * 60,
      refreshTokenExpiresIn: 7 * 24 * 60 * 60,
    },
  };
}
