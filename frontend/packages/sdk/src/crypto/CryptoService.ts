import { CipherStringParser } from './CipherString';

/**
 * CryptoService handles symmetric (AES-CBC + HMAC) and asymmetric (RSA-OAEP) encryption.
 * It follows the Bitwarden-compatible Cipher String Type 2 format.
 */
export class CryptoService {
  /**
   * Encrypts data using AES-256-CBC and signs it with HMAC-SHA256.
   * Format: 2.<iv>|<ciphertext>|<mac> (all base64)
   */
  static async encryptSymmetric(
    plaintext: string,
    encKey: CryptoKey,
    macKey: CryptoKey
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // 1. Encrypt with AES-CBC
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      encKey,
      data
    );

    // 2. Sign the ciphertext (Encrypt-then-MAC)
    // Standard approach: HMAC(IV + Ciphertext)
    const combinedData = new Uint8Array(iv.length + ciphertext.byteLength);
    combinedData.set(iv);
    combinedData.set(new Uint8Array(ciphertext), iv.length);

    const mac = await crypto.subtle.sign(
      { name: 'HMAC' },
      macKey,
      combinedData
    );

    // 3. Format as Type 2 Cipher String using Parser
    return CipherStringParser.serialize(
      iv,
      new Uint8Array(ciphertext),
      new Uint8Array(mac)
    );
  }

  /**
   * Decrypts a Type 2 Cipher String.
   */
  static async decryptSymmetric(
    cipherString: string,
    encKey: CryptoKey,
    macKey: CryptoKey
  ): Promise<string> {
    const { iv, ciphertext, mac } = CipherStringParser.parse(cipherString);

    // 1. Verify HMAC (MAC-then-Decrypt)
    const combinedData = new Uint8Array(iv.length + ciphertext.byteLength);
    combinedData.set(iv);
    combinedData.set(ciphertext, iv.length);

    const isValid = await crypto.subtle.verify(
      { name: 'HMAC' },
      macKey,
      mac,
      combinedData
    );

    if (!isValid) {
      throw new Error('MAC verification failed. The data may have been tampered with or the key is incorrect.');
    }

    // 2. Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      encKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  }

  /**
   * Encrypts a secret for an agent using RSA-OAEP.
   */
  static async encryptAsymmetric(
    plaintext: string,
    publicKey: CryptoKey
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      data
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Decrypts a secret for an agent using RSA-OAEP.
   */
  static async decryptAsymmetric(
    ciphertextB64: string,
    privateKey: CryptoKey
  ): Promise<string> {
    const data = new Uint8Array(atob(ciphertextB64).split('').map(c => c.charCodeAt(0)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Generates an RSA-OAEP 4096-bit key pair for an agent.
   */
  static async generateAgentKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Exports a public key to SPKI format (base64).
   */
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Imports a public key from SPKI format (base64).
   */
  static async importPublicKey(spkiB64: string): Promise<CryptoKey> {
    const data = new Uint8Array(atob(spkiB64).split('').map(c => c.charCodeAt(0)));
    return crypto.subtle.importKey(
      'spki',
      data,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  }

  /**
   * Exports a private key to PKCS8 format (base64).
   */
  static async exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Imports a private key from PKCS8 format (base64).
   */
  static async importPrivateKey(pkcs8B64: string): Promise<CryptoKey> {
    const data = new Uint8Array(atob(pkcs8B64).split('').map(c => c.charCodeAt(0)));
    return crypto.subtle.importKey(
      'pkcs8',
      data,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
  }
}
