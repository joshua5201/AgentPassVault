package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ForgotPasswordRequest(
    @NotNull(message = "Tenant ID cannot be null") UUID tenantId,
    @NotBlank(message = "Username cannot be blank") String username) {}
