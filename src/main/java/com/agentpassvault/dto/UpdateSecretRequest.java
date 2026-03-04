/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record UpdateSecretRequest(
    String name,
    @Size(max = 87381, message = "Encrypted value must not exceed 64 KB") String encryptedValue,
    Map<String, Object> metadata,
    Map<String, Object> schema,
    List<LeaseUpdateRequest> updatedLeases) {

  public UpdateSecretRequest(
      String name,
      String encryptedValue,
      Map<String, Object> metadata,
      List<LeaseUpdateRequest> updatedLeases) {
    this(name, encryptedValue, metadata, null, updatedLeases);
  }

  public record LeaseUpdateRequest(String agentId, String publicKey, String encryptedData) {}
}
