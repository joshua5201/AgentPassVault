package com.agentvault.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record RequestResponse(
    String id,
    UUID requestId,
    String status,
    String name,
    String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue,
    String mappedSecretId,
    String rejectionReason,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
