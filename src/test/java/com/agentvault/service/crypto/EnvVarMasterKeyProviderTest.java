/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.service.crypto;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class EnvVarMasterKeyProviderTest {

  @Autowired private MasterKeyProvider masterKeyProvider;

  @Test
  void getMasterKey_ShouldReturn32ByteKey() {
    assertNotNull(masterKeyProvider);
    byte[] masterKey = masterKeyProvider.getMasterKey();
    assertNotNull(masterKey);
    assertEquals(32, masterKey.length);
  }

  @Test
  void constructor_WithMissingKey_ShouldThrowException() {
    assertThrows(IllegalStateException.class, () -> new EnvVarMasterKeyProvider(null));
    assertThrows(IllegalStateException.class, () -> new EnvVarMasterKeyProvider(""));
  }

  @Test
  void constructor_WithInvalidKeyLength_ShouldThrowException() {
    String invalidKey = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA="; // 24 bytes base64 encoded
    assertThrows(IllegalStateException.class, () -> new EnvVarMasterKeyProvider(invalidKey));
  }
}
