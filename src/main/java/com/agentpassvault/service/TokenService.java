/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.config.JwtConfig;
import com.agentpassvault.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private final SecretKey secretKey;
  private final long expirationMinutes;
  private final long refreshExpirationMinutes;
  private final long leaseExpirationMinutes;

  public TokenService(JwtConfig jwtConfig) {
    this.secretKey = jwtConfig.getSecretKey();
    this.expirationMinutes = jwtConfig.getExpirationMinutes();
    this.refreshExpirationMinutes = jwtConfig.getRefreshExpirationMinutes();
    this.leaseExpirationMinutes = jwtConfig.getLeaseExpirationMinutes();
  }

  public String generateToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("tenant_id", user.getTenant().getId().toString())
        .claim("role", user.getRole().name())
        .claim("type", "access")
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
        .signWith(secretKey)
        .compact();
  }

  public String generateRefreshToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("type", "refresh")
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(refreshExpirationMinutes, ChronoUnit.MINUTES)))
        .signWith(secretKey)
        .compact();
  }

  public Long getUserIdFromToken(String token, String expectedType) {
    Claims claims =
        Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();

    String type = claims.get("type", String.class);
    if (!expectedType.equals(type)) {
      throw new IllegalArgumentException("Invalid token type");
    }

    return Long.parseLong(claims.getSubject());
  }

  public String generateLeaseToken(
      Long tenantId,
      String agentUserId,
      String approvedByUserId,
      String secretId,
      String requestId) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(agentUserId)
        .claim("tenant_id", tenantId.toString())
        .claim("approvedBy", approvedByUserId)
        .claim("secretId", secretId)
        .claim("requestId", requestId)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(leaseExpirationMinutes, ChronoUnit.MINUTES)))
        .signWith(secretKey)
        .compact();
  }

  public void validateLeaseToken(String token, String secretId) {
    Claims claims =
        Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();

    String tokenSecretId = claims.get("secretId", String.class);
    if (!secretId.equals(tokenSecretId)) {
      throw new IllegalArgumentException("Invalid lease token for the requested secret");
    }
  }

  public long getExpirationMinutes() {
    return expirationMinutes;
  }

  public long getRefreshExpirationMinutes() {
    return refreshExpirationMinutes;
  }
}
