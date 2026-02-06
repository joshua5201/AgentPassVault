/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record CreateSecretRequest(
    @NotBlank(message = "Secret name cannot be blank") String name,
    @NotBlank(message = "Encrypted secret value cannot be blank")
        @Size(max = 87381, message = "Encrypted value must not exceed 64 KB")
        String encryptedValue,
    Map<String, Object> metadata) {}
