/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.service;

import com.agentvault.config.JwtConfig;
import com.agentvault.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private final SecretKey secretKey;
  private final long expirationMinutes;

  public TokenService(JwtConfig jwtConfig) {
    this.secretKey = jwtConfig.getSecretKey();
    this.expirationMinutes = jwtConfig.getExpirationMinutes();
  }

  public String generateToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("tenant_id", user.getTenantId().toString())
        .claim("role", user.getRole().name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
        .signWith(secretKey)
        .compact();
  }

  public String generateLeaseToken(
      UUID tenantId,
      String agentUserId,
      String approvedByUserId,
      String secretId,
      String requestId) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(agentUserId)
        .claim("tenantId", tenantId)
        .claim("approvedBy", approvedByUserId)
        .claim("secretId", secretId)
        .claim("requestId", requestId)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(60, ChronoUnit.MINUTES))) // Default 60 minutes
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
}
