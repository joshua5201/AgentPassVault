import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from '../../src/crypto/CryptoService';

describe('CryptoService', () => {
  let encKey: CryptoKey;
  let macKey: CryptoKey;

  beforeEach(async () => {
    encKey = await crypto.subtle.generateKey(
      { name: 'AES-CBC', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    macKey = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign', 'verify']
    );
  });

  describe('Symmetric Encryption (Bitwarden Compatible)', () => {
    it('should encrypt and decrypt a string successfully', async () => {
      const plaintext = 'secret message 123';
      const encrypted = await CryptoService.encryptSymmetric(plaintext, encKey, macKey);
      
      expect(encrypted.startsWith('2.')).toBe(true);
      expect(encrypted.split('|')).toHaveLength(3);

      const decrypted = await CryptoService.decryptSymmetric(encrypted, encKey, macKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error if MAC is tampered', async () => {
      const plaintext = 'secure data';
      const encrypted = await CryptoService.encryptSymmetric(plaintext, encKey, macKey);
      
      // Tamper with the MAC (last part)
      const parts = encrypted.split('|');
      parts[2] = parts[2].substring(0, parts[2].length - 4) + 'AAAA'; 
      const tampered = parts.join('|');

      await expect(CryptoService.decryptSymmetric(tampered, encKey, macKey))
        .rejects.toThrow('MAC verification failed');
    });

    it('should throw error if ciphertext is tampered', async () => {
      const plaintext = 'secure data';
      const encrypted = await CryptoService.encryptSymmetric(plaintext, encKey, macKey);
      
      // Tamper with ciphertext (middle part)
      const parts = encrypted.split('|');
      parts[1] = parts[1].substring(0, parts[1].length - 4) + 'BBBB';
      const tampered = parts.join('|');

      await expect(CryptoService.decryptSymmetric(tampered, encKey, macKey))
        .rejects.toThrow('MAC verification failed');
    });
  });

  describe('Asymmetric Encryption (RSA-OAEP)', () => {
    it('should encrypt and decrypt using agent key pair', async () => {
      const keyPair = await CryptoService.generateAgentKeyPair();
      const plaintext = 'agent secret token';

      const encrypted = await CryptoService.encryptAsymmetric(plaintext, keyPair.publicKey);
      const decrypted = await CryptoService.decryptAsymmetric(encrypted, keyPair.privateKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should export and import keys successfully', async () => {
      const keyPair = await CryptoService.generateAgentKeyPair();
      
      const exportedPub = await CryptoService.exportPublicKey(keyPair.publicKey);
      const exportedPriv = await CryptoService.exportPrivateKey(keyPair.privateKey);

      expect(typeof exportedPub).toBe('string');
      expect(typeof exportedPriv).toBe('string');

      const importedPub = await CryptoService.importPublicKey(exportedPub);
      const importedPriv = await CryptoService.importPrivateKey(exportedPriv);

      const plaintext = 'another secret';
      const encrypted = await CryptoService.encryptAsymmetric(plaintext, importedPub);
      const decrypted = await CryptoService.decryptAsymmetric(encrypted, importedPriv);

      expect(decrypted).toBe(plaintext);
    });
  });
});
