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

import com.agentvault.dto.AgentLoginRequest;
import com.agentvault.dto.LoginResponse;
import com.agentvault.dto.UserLoginRequest;
import com.agentvault.model.User;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final TenantRepository tenantRepository;
  private final PasswordEncoder passwordEncoder;
  private final TokenService tokenService;

  public LoginResponse userLogin(UserLoginRequest request) {
    User user =
        userRepository
            .findByUsername(request.username())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid credentials");
    }

    String token = tokenService.generateToken(user);
    return new LoginResponse(token, "Bearer", 3600);
  }

  public LoginResponse agentLogin(AgentLoginRequest request) {
    Long tenantId = Long.valueOf(request.tenantId());
    // Validate Tenant First
    if (tenantRepository.findById(tenantId).isEmpty()) {
      throw new BadCredentialsException("Tenant not found");
    }

    String tokenHash = hashToken(request.appToken());
    User user =
        userRepository
            .findByTenant_IdAndAppTokenHash(tenantId, tokenHash)
            .orElseThrow(() -> new BadCredentialsException("Invalid token"));

    String token = tokenService.generateToken(user);
    return new LoginResponse(token, "Bearer", 3600);
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("Error hashing token", e);
    }
  }
}