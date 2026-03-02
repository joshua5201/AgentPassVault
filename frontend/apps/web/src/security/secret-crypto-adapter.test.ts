import { describe, expect, it } from "vitest";
import { CryptoService, MasterKeyService } from "@agentpassvault/sdk";
import { SecretCryptoAdapter } from "./secret-crypto-adapter";

const MOCK_USERNAME = "vault-admin+mock@agentpassvault.local";
const MOCK_PASSWORD = "MockMasterPass!2026#LocalOnly";

describe("SecretCryptoAdapter", () => {
  it("encrypts plaintext and keeps payload string-based", async () => {
    const masterKeys = await MasterKeyService.deriveMasterKeys(MOCK_PASSWORD, MOCK_USERNAME);
    const plaintext = "my-plain-secret-value";

    const encrypted = await SecretCryptoAdapter.encryptPlaintextSecret(
      {
        name: "Mock Secret",
        plaintextValue: plaintext,
        metadata: { service: "aws" },
      },
      masterKeys,
    );

    expect(encrypted.encryptedValue).not.toContain(plaintext);
    expect(encrypted.encryptedValue.startsWith("2.")).toBe(true);

    const decrypted = await CryptoService.decryptSymmetric(
      encrypted.encryptedValue,
      masterKeys.encKey,
      masterKeys.macKey,
    );

    expect(decrypted).toBe(plaintext);
  });
});
