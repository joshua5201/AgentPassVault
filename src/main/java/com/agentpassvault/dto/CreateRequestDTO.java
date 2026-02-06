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
package com.agentpassvault.dto;

import com.agentpassvault.model.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record CreateRequestDTO(
    @NotBlank(message = "Request name cannot be blank") String name,
    @Size(max = 2048, message = "Context must not exceed 2 KB") String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue,
    @NotNull RequestType type,
    @Pattern(regexp = "^[0-9]+$", message = "Secret ID must be numeric") String secretId) {

  // Constructor for CREATE requests
  public CreateRequestDTO(
      String name,
      String context,
      Map<String, Object> requiredMetadata,
      List<String> requiredFieldsInSecretValue) {
    this(name, context, requiredMetadata, requiredFieldsInSecretValue, RequestType.CREATE, null);
  }
}
