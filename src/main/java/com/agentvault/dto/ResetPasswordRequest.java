package com.agentvault.dto;

public record ResetPasswordRequest(String token, String newPassword) {}
