package com.agentvault.dto;

import java.util.Map;

public record CreateSecretRequest(String name, String value, Map<String, Object> metadata) {}
