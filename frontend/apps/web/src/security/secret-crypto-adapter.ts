import { SecretService, type MasterKeys } from "@agentpassvault/sdk";

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
}
