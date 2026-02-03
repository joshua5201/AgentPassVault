package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAgentRequest(@NotBlank(message = "Agent name cannot be blank") String name) {}
