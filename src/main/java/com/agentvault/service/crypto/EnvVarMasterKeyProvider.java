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

import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EnvVarMasterKeyProvider implements MasterKeyProvider {

  private final byte[] masterKey;

  public EnvVarMasterKeyProvider(@Value("${agentvault.system.key}") String base64Key) {
    if (base64Key == null || base64Key.isBlank()) {
      throw new IllegalStateException("System Master Key (AGENTVAULT_SYSTEM_KEY) is missing!");
    }
    this.masterKey = Base64.getDecoder().decode(base64Key);

    if (this.masterKey.length != 32) {
      throw new IllegalStateException(
          "System Master Key must be exactly 32 bytes (256 bits) for AES-256. "
              + "Ensure your 'AGENTVAULT_SYSTEM_KEY' is a Base64-encoded string of 32 random bytes.");
    }
  }

  @Override
  public byte[] getMasterKey() {
    return masterKey;
  }
}
