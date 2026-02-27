import { describe, expect, it } from "vitest";
import { AuthCryptoOrchestrator } from "./auth-crypto-orchestrator";

const MOCK_USERNAME = "vault-admin+mock@agentpassvault.local";
const MOCK_PASSWORD = "MockMasterPass!2026#LocalOnly";

describe("AuthCryptoOrchestrator", () => {
  it("derives deterministic login hash for same credentials", async () => {
    const first = await AuthCryptoOrchestrator.deriveForLogin(MOCK_USERNAME, MOCK_PASSWORD);
    const second = await AuthCryptoOrchestrator.deriveForLogin(MOCK_USERNAME, MOCK_PASSWORD);

    expect(first.loginHash).toBe(second.loginHash);
    expect(first.loginHash).not.toBe(MOCK_PASSWORD);
  });

  it("validates unlock password against expected login hash", async () => {
    const derived = await AuthCryptoOrchestrator.deriveForLogin(MOCK_USERNAME, MOCK_PASSWORD);

    const validUnlock = await AuthCryptoOrchestrator.validateUnlockPassword(
      MOCK_USERNAME,
      MOCK_PASSWORD,
      derived.loginHash,
    );
    const invalidUnlock = await AuthCryptoOrchestrator.validateUnlockPassword(
      MOCK_USERNAME,
      "wrong-password",
      derived.loginHash,
    );

    expect(validUnlock.valid).toBe(true);
    expect(validUnlock.masterKeys).toBeDefined();
    expect(invalidUnlock.valid).toBe(false);
  });
});
