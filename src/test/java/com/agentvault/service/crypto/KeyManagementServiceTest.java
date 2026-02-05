/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
