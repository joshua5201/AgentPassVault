/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.service.crypto;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

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
