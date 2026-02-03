package com.agentvault.service.crypto;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KeyManagementServiceTest {

  @Mock private MasterKeyProvider masterKeyProvider;

  @Spy private EncryptionService encryptionService; // Spy to use real encryption logic

  @InjectMocks private KeyManagementService keyManagementService;

  @Test
  void testGenerateAndDecryptTenantKey() {
    // Mock the SMK
    byte[] smk = encryptionService.generateKey();
    when(masterKeyProvider.getMasterKey()).thenReturn(smk);

    // Generate an encrypted Tenant Key
    byte[] encryptedTK = keyManagementService.generateEncryptedTenantKey();
    assertNotNull(encryptedTK);

    // Decrypt it back
    byte[] decryptedTK = keyManagementService.decryptTenantKey(encryptedTK);
    assertNotNull(decryptedTK);
    assertEquals(32, decryptedTK.length, "Tenant Key should be 32 bytes");
  }
}
