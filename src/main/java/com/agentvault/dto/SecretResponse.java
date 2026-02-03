package com.agentvault.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record SecretResponse(
    String id,
    String name,
    String value, // Decrypted value
    Map<String, Object> metadata,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
