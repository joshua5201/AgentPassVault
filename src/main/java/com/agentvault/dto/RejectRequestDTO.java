package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRequestDTO(@NotBlank(message = "Reason cannot be blank") String reason) {}
