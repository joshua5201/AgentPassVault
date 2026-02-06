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
package com.agentvault.controller;

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AuthService;
import com.agentvault.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

  private final AuthService authService;
  private final UserService userService;

  @PostMapping("/login/user")
  public LoginResponse userLogin(@Valid @RequestBody UserLoginRequest request) {
    return authService.userLogin(request);
  }

  @PostMapping("/login/agent")
  public LoginResponse agentLogin(@Valid @RequestBody AgentLoginRequest request) {
    return authService.agentLogin(request);
  }

  @PostMapping("/refresh")
  public LoginResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
    return authService.refreshToken(request.refreshToken());
  }

  @PostMapping("/change-password")
  public void changePassword(
      AgentVaultAuthentication authentication, @Valid @RequestBody ChangePasswordRequest request) {

    userService.changePassword(
        (Long) authentication.getPrincipal(), request.oldPassword(), request.newPassword());
  }

  @PostMapping("/forgot-password")
  public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {

    String token = userService.initiatePasswordReset(request.username());

    return Map.of("resetToken", token);
  }

  @PostMapping("/reset-password")
  public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {

    userService.resetPassword(request.token(), request.newPassword());
  }

  @GetMapping("/ping")
  public Map<String, Object> ping(AgentVaultAuthentication authentication) {

    return Map.of(
        "message",
        "pong",
        "tenantId",
        authentication.getTenantId().toString(),
        "userId",
        authentication.getPrincipal().toString(),
        "role",
        authentication.getRole());
  }
}
