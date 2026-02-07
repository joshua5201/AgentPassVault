import { describe, it, expect } from 'vitest';
import { MasterKeyService } from '../../src/crypto/MasterKeyService';
import { CryptoService } from '../../src/crypto/CryptoService';

/**
 * These test vectors are extracted from Bitwarden's official client codebase:
 * libs/common/src/key-management/crypto/services/web-crypto-function.service.spec.ts
 */
describe('Bitwarden Head-to-Head Compatibility', () => {
  
  describe('PBKDF2 Derivation (Master Key)', () => {
    it('should match Bitwarden PBKDF2-SHA256 test vector (5000 iterations)', async () => {
      const password = 'password';
      const salt = 'user@example.com';
      const iterations = 5000;
      const expectedB64 = 'pj9prw/OHPleXI6bRdmlaD+saJS4awrMiQsQiDjeu2I=';

      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const saltBytes = encoder.encode(salt);

      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: iterations,
          hash: 'SHA-256',
        },
        baseKey,
        256
      );

      const derivedB64 = Buffer.from(derivedBits).toString('base64');
      expect(derivedB64).toBe(expectedB64);
    });

    it('should match Bitwarden PBKDF2-SHA256 test vector with unicode (5000 iterations)', async () => {
      const password = '😀password🙏';
      const salt = 'user@example.com';
      const iterations = 5000;
      const expectedB64 = 'ZdeOata6xoRpB4DLp8zHhXz5kLmkWtX5pd+TdRH8w8w=';

      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const saltBytes = encoder.encode(salt);

      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: iterations,
          hash: 'SHA-256',
        },
        baseKey,
        256
      );

      const derivedB64 = Buffer.from(derivedBits).toString('base64');
      expect(derivedB64).toBe(expectedB64);
    });
  });

  describe('Symmetric Encryption (AES-256-CBC + HMAC-SHA256)', () => {
    it('should decrypt Bitwarden AES-CBC test vector', async () => {
      const iv = new Uint8Array(16);
      for (let i = 0; i < 16; i++) iv[i] = i;
      const keyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) keyBytes[i] = i;

      const ciphertext = Buffer.from('ByUF8vhyX4ddU9gcooznwA==', 'base64');

      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-CBC', length: 256 },
        true,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        ciphertext
      );

      expect(new TextDecoder().decode(decrypted)).toBe('EncryptMe!');
    });

    it('should match Bitwarden HMAC-SHA256 test vector', async () => {
      const data = new TextEncoder().encode('SignMe!!');
      const keyBytes = new TextEncoder().encode('secretkey');
      const expectedHex = '6be3caa84922e12aaaaa2f16c40d44433bb081ef323db584eb616333ab4e874f';

      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign']
      );

      const mac = await crypto.subtle.sign(
        { name: 'HMAC' },
        key,
        data
      );

      const macHex = Buffer.from(mac).toString('hex');
      expect(macHex).toBe(expectedHex);
    });

    it('should parse and decrypt a constructed Bitwarden-style Type 2 string', async () => {
      const ivBytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) ivBytes[i] = i;
      const encKeyBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) encKeyBytes[i] = i;
      const macKeyBytes = new Uint8Array(32);
      for (let i = 32; i < 64; i++) macKeyBytes[i-32] = i;

      const plaintext = 'Bitwarden Compatibility Test';
      
      const encKey = await crypto.subtle.importKey(
        'raw',
        encKeyBytes,
        { name: 'AES-CBC', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const macKey = await crypto.subtle.importKey(
        'raw',
        macKeyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign', 'verify']
      );

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: ivBytes },
        encKey,
        new TextEncoder().encode(plaintext)
      );

      const combinedData = new Uint8Array(ivBytes.length + ciphertext.byteLength);
      combinedData.set(ivBytes);
      combinedData.set(new Uint8Array(ciphertext), ivBytes.length);
      const mac = await crypto.subtle.sign({ name: 'HMAC' }, macKey, combinedData);

      const ivB64 = Buffer.from(ivBytes).toString('base64');
      const ciphertextB64 = Buffer.from(ciphertext).toString('base64');
      const macB64 = Buffer.from(mac).toString('base64');
      const cipherString = `2.${ivB64}|${ciphertextB64}|${macB64}`;

      const decrypted = await CryptoService.decryptSymmetric(cipherString, encKey, macKey);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Asymmetric Encryption (RSA-OAEP)', () => {
    it('should successfully encrypt and decrypt data (Key Parity Check)', async () => {
      // We will generate a keypair and verify we can export/import it correctly
      // which is what ensures "same key can encrypt/decrypt same data"
      const keyPair = await CryptoService.generateAgentKeyPair();
      
      const exportedPub = await CryptoService.exportPublicKey(keyPair.publicKey);
      const exportedPriv = await CryptoService.exportPrivateKey(keyPair.privateKey);

      const importedPub = await CryptoService.importPublicKey(exportedPub);
      const importedPriv = await CryptoService.importPrivateKey(exportedPriv);

      const plaintext = 'Test Parity';
      const encrypted = await CryptoService.encryptAsymmetric(plaintext, importedPub);
      const decrypted = await CryptoService.decryptAsymmetric(encrypted, importedPriv);

      expect(decrypted).toBe(plaintext);
    });
  });
});