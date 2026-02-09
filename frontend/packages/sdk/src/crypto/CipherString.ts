export interface CipherString {
  type: number;
  iv: Uint8Array;
  ciphertext: Uint8Array;
  mac: Uint8Array;
}

export class CipherStringParser {
  /**
   * Parses a Bitwarden-compatible Type 2 Cipher String.
   * Format: 2.<iv>|<ciphertext>|<mac>
   */
  static parse(cipherString: string): CipherString {
    if (!cipherString.startsWith('2.')) {
      throw new Error('Unsupported or invalid cipher string type. Currently only Type 2 (AES-CBC + HMAC) is supported.');
    }

    const parts = cipherString.substring(2).split('|');
    if (parts.length !== 3) {
      throw new Error('Invalid cipher string format. Expected 2.<iv>|<ciphertext>|<mac>');
    }

    const [ivB64, ciphertextB64, macB64] = parts;

    try {
      return {
        type: 2,
        iv: this.base64ToBytes(ivB64),
        ciphertext: this.base64ToBytes(ciphertextB64),
        mac: this.base64ToBytes(macB64),
      };
    } catch (e) {
      throw new Error('Failed to decode base64 components of cipher string');
    }
  }

  /**
   * Serializes components into a Type 2 Cipher String.
   */
  static serialize(iv: Uint8Array, ciphertext: Uint8Array, mac: Uint8Array): string {
    const ivB64 = this.bytesToBase64(iv);
    const ciphertextB64 = this.bytesToBase64(ciphertext);
    const macB64 = this.bytesToBase64(mac);

    return `2.${ivB64}|${ciphertextB64}|${macB64}`;
  }

  private static base64ToBytes(b64: string): Uint8Array {
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  }

  private static bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
}
