import { CryptoService } from '../crypto/CryptoService';
import { MasterKeys } from '../crypto/MasterKeyService';
import { Secret, LeasedSecret } from '../models';

export class LeaseService {
  /**
   * Creates a LeasedSecret by decrypting the original secret and re-encrypting it with the agent's public key.
   * This operation MUST happen in a secure context (like the Web UI) where the Master Key is available.
   */
  static async createLease(
    secret: Secret,
    masterKeys: MasterKeys,
    agentPublicKeyB64: string,
    agentId: string,
    expiresAt: string | null = null
  ): Promise<Partial<LeasedSecret>> {
    // 1. Decrypt the secret using Master Key
    const plaintext = await CryptoService.decryptSymmetric(
      secret.encryptedValue,
      masterKeys.encKey,
      masterKeys.macKey
    );

    // 2. Import Agent Public Key
    const agentPublicKey = await CryptoService.importPublicKey(agentPublicKeyB64);

    // 3. Encrypt with Agent Public Key (RSA-OAEP)
    const encryptedForAgent = await CryptoService.encryptAsymmetric(
      plaintext,
      agentPublicKey
    );

    return {
      secretId: secret.id,
      agentId,
      encryptedValue: encryptedForAgent,
      expiresAt,
    };
  }
}
