import { CryptoService } from "../crypto/CryptoService";
import { MasterKeys } from "../crypto/MasterKeyService";
import { Metadata, Secret } from "../models";

export class SecretService {
  /**
   * Prepares a new Secret object by encrypting the value.
   */
  static async createSecret(
    name: string,
    value: string,
    metadata: Metadata,
    masterKeys: MasterKeys,
  ): Promise<Partial<Secret>> {
    const encryptedValue = await CryptoService.encryptSymmetric(
      value,
      masterKeys.encKey,
      masterKeys.macKey,
    );

    return {
      name,
      encryptedValue,
      metadata,
    };
  }

  /**
   * Decrypts a Secret's value.
   */
  static async decryptSecret(
    secret: Secret,
    masterKeys: MasterKeys,
  ): Promise<string> {
    return CryptoService.decryptSymmetric(
      secret.encryptedValue,
      masterKeys.encKey,
      masterKeys.macKey,
    );
  }
}
