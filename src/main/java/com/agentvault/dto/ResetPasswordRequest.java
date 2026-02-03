package com.agentvault.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
    @NotBlank(message = "Reset token cannot be blank") String token,
    @NotBlank(message = "New password cannot be blank") String newPassword) {}
