package com.agentvault.dto;

public record ChangePasswordRequest(String oldPassword, String newPassword) {}
