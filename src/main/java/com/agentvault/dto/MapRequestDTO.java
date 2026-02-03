package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;

public record MapRequestDTO(@NotBlank(message = "Secret ID cannot be blank") String secretId) {}
