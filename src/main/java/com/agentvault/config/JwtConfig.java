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
package com.agentvault.config;

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

  @Value("${agentvault.jwt.secret}")
  private String jwtSecret;

  @Value("${agentvault.jwt.expiration-minutes}")
  private long expirationMinutes;

  @Value("${agentvault.jwt.refresh-expiration-minutes}")
  private long refreshExpirationMinutes;

  @Value("${agentvault.jwt.lease-expiration-minutes:60}")
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
