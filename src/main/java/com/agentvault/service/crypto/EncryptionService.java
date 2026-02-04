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

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {

  private static final String ALGORITHM = "AES";
  private static final String TRANSFORMATION = "AES/GCM/NoPadding";
  private static final int AES_KEY_SIZE = 256;
  private static final int GCM_IV_LENGTH = 12; // 12 bytes
  private static final int GCM_TAG_LENGTH = 128; // 128 bits

  private final SecureRandom secureRandom = new SecureRandom();

  /** Generates a new random AES-256 key. */
  public byte[] generateKey() {
    try {
      KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
      keyGen.init(AES_KEY_SIZE, secureRandom);
      SecretKey secretKey = keyGen.generateKey();
      return secretKey.getEncoded();
    } catch (Exception e) {
      throw new RuntimeException("Error generating key", e);
    }
  }

  /**
   * Encrypts data using AES-GCM. The output format is: IV (12 bytes) + Encrypted Data + Auth Tag
   * (appended by GCM automatically)
   */
  public byte[] encrypt(byte[] data, byte[] key) {
    try {
      byte[] iv = new byte[GCM_IV_LENGTH];
      secureRandom.nextBytes(iv);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, ALGORITHM);
      cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, parameterSpec);

      byte[] cipherText = cipher.doFinal(data);

      ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
      byteBuffer.put(iv);
      byteBuffer.put(cipherText);
      return byteBuffer.array();
    } catch (Exception e) {
      throw new RuntimeException("Error encrypting data", e);
    }
  }

  /**
   * Decrypts data using AES-GCM. Expects input format: IV (12 bytes) + Encrypted Data + Auth Tag
   */
  public byte[] decrypt(byte[] encryptedDataWithIv, byte[] key) {
    try {
      if (encryptedDataWithIv.length < GCM_IV_LENGTH) {
        throw new IllegalArgumentException("Invalid encrypted data format");
      }

      ByteBuffer byteBuffer = ByteBuffer.wrap(encryptedDataWithIv);
      byte[] iv = new byte[GCM_IV_LENGTH];
      byteBuffer.get(iv);

      byte[] cipherText = new byte[byteBuffer.remaining()];
      byteBuffer.get(cipherText);

      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      SecretKeySpec secretKeySpec = new SecretKeySpec(key, ALGORITHM);
      cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, parameterSpec);

      return cipher.doFinal(cipherText);
    } catch (Exception e) {
      throw new RuntimeException("Error decrypting data", e);
    }
  }
}
