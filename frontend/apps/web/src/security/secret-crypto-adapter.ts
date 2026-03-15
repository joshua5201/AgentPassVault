import { CryptoService, SecretService, type MasterKeys } from "@agentpassvault/sdk";

export class SecretCryptoAdapter {
  static async encryptPlaintextSecret(
    input: {
      name: string;
      plaintextValue: string;
      metadata: Record<string, string>;
    },
    masterKeys: MasterKeys,
  ): Promise<{
    name: string;
    encryptedValue: string;
    metadata: Record<string, string>;
  }> {
    const prepared = await SecretService.createSecret(
      input.name,
      input.plaintextValue,
      input.metadata,
      masterKeys,
    );

    if (!prepared.encryptedValue || !prepared.name) {
      throw new Error("Failed to encrypt secret payload");
    }

    return {
      name: prepared.name,
      encryptedValue: prepared.encryptedValue,
      metadata: (prepared.metadata ?? {}) as Record<string, string>,
    };
  }

  static async decryptSecret(encryptedValue: string, masterKeys: MasterKeys): Promise<string> {
    return CryptoService.decryptSymmetric(encryptedValue, masterKeys.encKey, masterKeys.macKey);
  }

  static async encryptForAgent(plaintext: string, agentPublicKey: string): Promise<string> {
    const importedAgentKey = await CryptoService.importPublicKey(agentPublicKey);
    return CryptoService.encryptAsymmetric(plaintext, importedAgentKey);
  }
}
