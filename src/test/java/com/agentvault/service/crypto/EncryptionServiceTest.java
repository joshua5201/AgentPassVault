package com.agentvault.service.crypto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;

class EncryptionServiceTest {

    private final EncryptionService encryptionService = new EncryptionService();

    @Test
    void testGenerateKey() {
        byte[] key = encryptionService.generateKey();
        assertNotNull(key);
        assertEquals(32, key.length, "AES-256 key should be 32 bytes");
    }

    @Test
    void testEncryptDecrypt() {
        byte[] key = encryptionService.generateKey();
        String originalText = "Hello, AgentVault!";
        byte[] data = originalText.getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = encryptionService.encrypt(data, key);
        assertNotNull(encrypted);
        assertNotEquals(originalText, new String(encrypted, StandardCharsets.UTF_8));

        byte[] decrypted = encryptionService.decrypt(encrypted, key);
        assertNotNull(decrypted);
        assertEquals(originalText, new String(decrypted, StandardCharsets.UTF_8));
    }
}
