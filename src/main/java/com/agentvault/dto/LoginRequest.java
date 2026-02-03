package com.agentvault.dto;

import com.agentvault.validation.ValidLoginRequest;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@ValidLoginRequest
public record LoginRequest(
    @NotNull(message = "Tenant ID cannot be null") UUID tenantId,
    String username,
    String password,
    String appToken) {}
