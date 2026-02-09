/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import com.agentpassvault.model.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record CreateRequestRequest(
    @NotBlank(message = "Request name cannot be blank") String name,
    @Size(max = 2048, message = "Context must not exceed 2 KB") String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue,
    @NotNull RequestType type,
    @Pattern(regexp = "^[0-9]+$", message = "Secret ID must be numeric") String secretId) {

  // Constructor for CREATE requests
  public CreateRequestRequest(
      String name,
      String context,
      Map<String, Object> requiredMetadata,
      List<String> requiredFieldsInSecretValue) {
    this(name, context, requiredMetadata, requiredFieldsInSecretValue, RequestType.CREATE, null);
  }
}
