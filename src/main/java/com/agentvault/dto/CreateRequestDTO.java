package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public record CreateRequestDTO(
    @NotBlank(message = "Request name cannot be blank") String name,
    String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue) {}
