package com.agentvault.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentResponse(UUID id, String name, LocalDateTime createdAt) {}
