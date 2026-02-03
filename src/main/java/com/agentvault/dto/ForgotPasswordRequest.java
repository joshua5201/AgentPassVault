package com.agentvault.dto;

import java.util.UUID;

public record ForgotPasswordRequest(UUID tenantId, String username) {}
