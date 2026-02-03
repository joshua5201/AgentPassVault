package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record FulfillRequestDTO(
    @NotBlank(message = "Secret name cannot be blank") String name,
    @NotBlank(message = "Secret value cannot be blank") String value,
    Map<String, Object> metadata) {}
