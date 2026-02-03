package com.agentvault.dto;

import java.util.List;
import java.util.Map;

public record CreateRequestDTO(
    String name,
    String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue) {}
