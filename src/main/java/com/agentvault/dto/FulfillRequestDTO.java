package com.agentvault.dto;

import java.util.Map;

public record FulfillRequestDTO(
    String name,
    String value,
    Map<String, Object> metadata
) {}
