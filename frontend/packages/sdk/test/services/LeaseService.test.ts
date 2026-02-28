import { describe, it, expect, beforeEach } from "vitest";
import {
  MasterKeyService,
  MasterKeys,
} from "../../src/crypto/MasterKeyService";
import { CryptoService } from "../../src/crypto/CryptoService";
import { LeaseService } from "../../src/services/LeaseService";
import { SecretService } from "../../src/services/SecretService";
import { Secret } from "../../src/models";

describe("LeaseService", () => {
  let masterKeys: MasterKeys;
  const tenantId = "test-tenant";
  const password = "master-password";
  const salt = "user@example.com";

  beforeEach(async () => {
    masterKeys = await MasterKeyService.deriveMasterKeys(password, salt);
  });

  it(
    "should re-encrypt a secret for an agent",
    async () => {
      // 1. Create a secret
      const plaintext = "very-secret-payload";
      const secretData = await SecretService.createSecret(
        "My Secret",
        plaintext,
        { service: "aws" },
        masterKeys,
        tenantId,
      );

      const secret: Secret = {
        ...secretData,
        id: "secret-123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Secret;

      // 2. Generate Agent Keys
      const agentKeyPair = await CryptoService.generateAgentKeyPair();
      const agentPubKeyB64 = await CryptoService.exportPublicKey(
        agentKeyPair.publicKey,
      );

      // 3. Create Lease
      const leaseData = await LeaseService.createLease(
        secret,
        masterKeys,
        agentPubKeyB64,
        "agent-456",
      );

      expect(leaseData.encryptedValue).toBeDefined();
      expect(leaseData.encryptedValue).not.toBe(secret.encryptedValue);

      // 4. Decrypt as Agent
      const decryptedByAgent = await CryptoService.decryptAsymmetric(
        leaseData.encryptedValue!,
        agentKeyPair.privateKey,
      );

      expect(decryptedByAgent).toBe(plaintext);
    },
    20000,
  );
});
