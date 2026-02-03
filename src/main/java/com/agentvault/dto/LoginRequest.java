package com.agentvault.dto;

import java.util.UUID;

public record LoginRequest(
    UUID tenantId, String username, String password, String appToken // Used for agents
    ) {}
