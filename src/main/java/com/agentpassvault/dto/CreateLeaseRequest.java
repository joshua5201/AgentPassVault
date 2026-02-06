/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;

public record CreateLeaseRequest(
    @NotNull(message = "Agent ID is required")
        @Pattern(regexp = "^[0-9]+$", message = "Agent ID must be numeric")
        String agentId,
    @NotBlank(message = "Public key is required") String publicKey,
    @NotBlank(message = "Encrypted data cannot be blank") String encryptedData,
    Instant expiry) {}
