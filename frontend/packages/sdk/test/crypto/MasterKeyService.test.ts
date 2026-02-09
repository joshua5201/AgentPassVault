import { describe, it, expect } from 'vitest';
import { MasterKeyService } from '../../src/crypto/MasterKeyService';

describe('MasterKeyService', () => {
  it('should derive the same keys for the same password and salt', async () => {
    const password = 'my-master-password';
    const salt = 'user@example.com';

    const keys1 = await MasterKeyService.deriveMasterKeys(password, salt);
    const keys2 = await MasterKeyService.deriveMasterKeys(password, salt);

    const exportedEnc1 = await MasterKeyService.exportKey(keys1.encKey);
    const exportedEnc2 = await MasterKeyService.exportKey(keys2.encKey);
    const exportedMac1 = await MasterKeyService.exportKey(keys1.macKey);
    const exportedMac2 = await MasterKeyService.exportKey(keys2.macKey);

    expect(exportedEnc1).toEqual(exportedEnc2);
    expect(exportedMac1).toEqual(exportedMac2);
    expect(exportedEnc1.length).toBe(32); // 256 bits
    expect(exportedMac1.length).toBe(32); // 256 bits
  });

  it('should derive different keys for different passwords', async () => {
    const salt = 'user@example.com';
    const keys1 = await MasterKeyService.deriveMasterKeys('pass1', salt);
    const keys2 = await MasterKeyService.deriveMasterKeys('pass2', salt);

    const exportedEnc1 = await MasterKeyService.exportKey(keys1.encKey);
    const exportedEnc2 = await MasterKeyService.exportKey(keys2.encKey);

    expect(exportedEnc1).not.toEqual(exportedEnc2);
  });
});
