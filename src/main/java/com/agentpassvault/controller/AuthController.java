/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import com.agentpassvault.dto.*;
import com.agentpassvault.security.AgentPassVaultAuthentication;
import com.agentpassvault.service.AuthService;
import com.agentpassvault.service.UserService;
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
      AgentPassVaultAuthentication authentication,
      @Valid @RequestBody ChangePasswordRequest request) {

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
  public Map<String, Object> ping(AgentPassVaultAuthentication authentication) {

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
