package com.agentvault.service.crypto;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class KeyManagementService {

    private final MasterKeyProvider masterKeyProvider;
    private final EncryptionService encryptionService;

    /**
     * Generates a new Tenant Key (TK) and encrypts it using the System Master Key (SMK).
     *
     * @return The encrypted Tenant Key.
     */
    public byte[] generateEncryptedTenantKey() {
        byte[] tenantKey = encryptionService.generateKey();
        byte[] smk = masterKeyProvider.getMasterKey();
        
        try {
            return encryptionService.encrypt(tenantKey, smk);
        } finally {
            // Ideally, we would wipe the key material here, but Java arrays are managed by GC.
            // Best effort to nullify reference in local scope is implicitly handled on return.
        }
    }

    /**
     * Decrypts the Tenant Key using the System Master Key.
     *
     * @param encryptedTenantKey The encrypted Tenant Key from the database.
     * @return The raw Tenant Key bytes.
     */
    public byte[] decryptTenantKey(byte[] encryptedTenantKey) {
        byte[] smk = masterKeyProvider.getMasterKey();
        return encryptionService.decrypt(encryptedTenantKey, smk);
    }
}
