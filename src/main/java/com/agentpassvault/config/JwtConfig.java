/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

  @Value("${agentpassvault.jwt.secret}")
  private String jwtSecret;

  @Value("${agentpassvault.jwt.expiration-minutes}")
  private long expirationMinutes;

  @Value("${agentpassvault.jwt.refresh-expiration-minutes}")
  private long refreshExpirationMinutes;

  @Value("${agentpassvault.jwt.lease-expiration-minutes:60}")
  private long leaseExpirationMinutes;

  private SecretKey secretKey;

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
