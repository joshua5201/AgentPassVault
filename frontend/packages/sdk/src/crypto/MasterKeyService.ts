export interface MasterKeys {
  encKey: CryptoKey;
  macKey: CryptoKey;
}

/**
 * MasterKeyService handles the derivation of the Master Key from a user's password and salt.
 * It uses PBKDF2-HMAC-SHA256, following standards compatible with Bitwarden.
 */
export class MasterKeyService {
  private static readonly ALGORITHM = "PBKDF2";
  private static readonly HASH = "SHA-256";
  private static readonly ITERATIONS = 600000;
  private static readonly KEY_LENGTH = 512; // bits for combined enc + mac

  /**
   * Derives Master Keys (Encryption and MAC) from a password and salt.
   * @param password The user's master password.
   * @param salt The user's salt (usually their email).
   * @returns A promise resolving to the derived MasterKeys.
   */
  static async deriveMasterKeys(
    password: string,
    salt: string,
  ): Promise<MasterKeys> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const saltBytes = encoder.encode(salt);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: this.ALGORITHM,
        salt: saltBytes,
        iterations: this.ITERATIONS,
        hash: this.HASH,
      },
      baseKey,
      this.KEY_LENGTH,
    );

    const encKeyBytes = derivedBits.slice(0, 32);
    const macKeyBytes = derivedBits.slice(32, 64);

    const encKey = await crypto.subtle.importKey(
      "raw",
      encKeyBytes,
      { name: "AES-CBC", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    const macKey = await crypto.subtle.importKey(
      "raw",
      macKeyBytes,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"],
    );

    return { encKey, macKey };
  }

  /**
   * Derives the Login Hash from the Master Key and Master Password.
   * Following Bitwarden approach: PBKDF2-HMAC-SHA256(MasterKeyEnc, MasterPassword, 1 iteration)
   */
  static async deriveLoginHash(
    masterKeys: MasterKeys,
    password: string,
  ): Promise<string> {
    const encKeyBytes = await this.exportKey(masterKeys.encKey);
    const passwordBytes = new TextEncoder().encode(password);

    // Convert to a regular ArrayBuffer to ensure compatibility with BufferSource
    const encKeyBuffer = encKeyBytes.buffer.slice(
      encKeyBytes.byteOffset,
      encKeyBytes.byteOffset + encKeyBytes.byteLength,
    );

    const baseKey = await crypto.subtle.importKey(
      "raw",
      encKeyBuffer as any,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: this.ALGORITHM,
        salt: passwordBytes,
        iterations: 1,
        hash: this.HASH,
      },
      baseKey,
      256,
    );

    return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
  }

  /**
   * Exports a CryptoKey to a raw Uint8Array.
   */
  static async exportKey(key: CryptoKey): Promise<Uint8Array> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return new Uint8Array(exported);
  }
}
