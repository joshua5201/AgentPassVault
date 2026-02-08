/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(

    @NotBlank(message = "Username (email) is required")

    @Email(message = "Invalid email format")

    String username,



    @NotBlank(message = "Password is required")

    @Size(min = 8, message = "Password must be at least 8 characters")

    String password,



    String displayName

) {}


