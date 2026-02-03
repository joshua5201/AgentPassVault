package com.agentvault.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record SecretMetadataResponse(
    String id,
    String name,
    Map<String, Object> metadata,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
