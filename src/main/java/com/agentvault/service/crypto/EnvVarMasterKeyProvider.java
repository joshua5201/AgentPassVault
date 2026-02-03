package com.agentvault.service.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Base64;

@Component
public class EnvVarMasterKeyProvider implements MasterKeyProvider {

    private final byte[] masterKey;

    public EnvVarMasterKeyProvider(@Value("${agentvault.system.key}") String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("System Master Key (AGENTVAULT_SYSTEM_KEY) is missing!");
        }
        this.masterKey = Base64.getDecoder().decode(base64Key);
        
        if (this.masterKey.length != 32) {
            throw new IllegalStateException("System Master Key must be exactly 32 bytes (256 bits) for AES-256. " +
                    "Ensure your 'AGENTVAULT_SYSTEM_KEY' is a Base64-encoded string of 32 random bytes.");
        }
    }

    @Override
    public byte[] getMasterKey() {
        return masterKey;
    }
}
