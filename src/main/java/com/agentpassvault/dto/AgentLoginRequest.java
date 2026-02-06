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

public record AgentLoginRequest(
    @NotNull(message = "Tenant ID is required")
        @Pattern(regexp = "^[0-9]+$", message = "Tenant ID must be numeric")
        String tenantId,
    @NotBlank(message = "App token is required") String appToken) {}
