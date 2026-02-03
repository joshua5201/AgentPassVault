package com.agentvault.dto;

public record LoginResponse(String accessToken, String tokenType, long expiresIn) {}
