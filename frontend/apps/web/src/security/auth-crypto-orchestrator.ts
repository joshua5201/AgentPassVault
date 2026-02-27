import { MasterKeyService, type MasterKeys } from "@agentpassvault/sdk";

export interface LoginDerivationResult {
  username: string;
  loginHash: string;
  masterKeys: MasterKeys;
}

export class AuthCryptoOrchestrator {
  static async deriveForLogin(username: string, password: string): Promise<LoginDerivationResult> {
    const normalizedUsername = username.trim();
    const normalizedPassword = password;

    const masterKeys = await MasterKeyService.deriveMasterKeys(normalizedPassword, normalizedUsername);
    const loginHash = await MasterKeyService.deriveLoginHash(masterKeys, normalizedPassword);

    return {
      username: normalizedUsername,
      loginHash,
      masterKeys,
    };
  }

  static async validateUnlockPassword(
    username: string,
    password: string,
    expectedLoginHash: string,
  ): Promise<{ valid: boolean; masterKeys?: MasterKeys }> {
    const derived = await this.deriveForLogin(username, password);
    if (derived.loginHash !== expectedLoginHash) {
      return { valid: false };
    }

    return { valid: true, masterKeys: derived.masterKeys };
  }
}
