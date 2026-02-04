/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
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

  @Bean
  public JwtDecoder jwtDecoder() {
    byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
    SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    return NimbusJwtDecoder.withSecretKey(secretKey).build();
  }

  @Bean
  public JwtEncoder jwtEncoder() {
    byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
    SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    ImmutableSecret<SecurityContext> secret = new ImmutableSecret<>(secretKey);
    return new NimbusJwtEncoder(secret);
  }
}
