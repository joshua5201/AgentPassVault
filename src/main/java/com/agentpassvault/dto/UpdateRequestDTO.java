/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import com.agentpassvault.model.RequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateRequestDTO(
    @NotNull(message = "Status is required") RequestStatus status,
    // For FULFILL (Existing Secret)
    @Pattern(regexp = "^[0-9]+$", message = "Secret ID must be numeric") String secretId,
    // For REJECT
    String rejectionReason) {}
