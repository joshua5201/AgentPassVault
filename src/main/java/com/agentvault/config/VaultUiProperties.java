package com.agentvault.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "agentvault.ui")
@Validated
public record VaultUiProperties(@NotBlank String baseUrl, @NotBlank String fulfillmentPath) {}
