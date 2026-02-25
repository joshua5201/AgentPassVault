/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

  private static final Logger logger = LoggerFactory.getLogger(JwtConfig.class);

  @Value("${agentpassvault.jwt.secret}")
  private String jwtSecret;

  @Value("${agentpassvault.jwt.expiration-minutes}")
  private long expirationMinutes;

  @Value("${agentpassvault.jwt.refresh-expiration-minutes}")
  private long refreshExpirationMinutes;

  @Value("${agentpassvault.jwt.lease-expiration-minutes:60}")
  private long leaseExpirationMinutes;

  private SecretKey secretKey;

  @PostConstruct
  public void init() {
    try {
      // Fail fast if the provided JWT secret is invalid (e.g., too short for HMAC-SHA256)
      logger.info("Verifying JWT configuration and secret length...");
      SecretKey key = getSecretKey();
      Jwts.builder()
          .subject("startup-test-dummy")
          .issuedAt(Date.from(Instant.now()))
          .signWith(key)
          .compact();
      logger.info("JWT secret is valid and token generation is functioning correctly.");
    } catch (Exception e) {
      logger.error(
          "FATAL ERROR: JWT Token generation failed. Your 'agentpassvault.jwt.secret' might be invalid or too short. It must be at least 256 bits (32 bytes) for HMAC-SHA256.",
          e);
      throw new IllegalStateException(
          "Invalid JWT secret configuration. Please check 'agentpassvault.jwt.secret' property.",
          e);
    }
  }

  public SecretKey getSecretKey() {
    if (this.secretKey == null) {
      byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
      this.secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    }
    return this.secretKey;
  }

  public long getExpirationMinutes() {
    return expirationMinutes;
  }

  public long getRefreshExpirationMinutes() {
    return refreshExpirationMinutes;
  }

  public long getLeaseExpirationMinutes() {
    return leaseExpirationMinutes;
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(getSecretKey()).build();
  }

  @Bean
  public JwtEncoder jwtEncoder() {
    ImmutableSecret<SecurityContext> secret = new ImmutableSecret<>(getSecretKey());
    return new NimbusJwtEncoder(secret);
  }
}
