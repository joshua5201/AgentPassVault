package com.agentvault.controller;

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AuthService;
import com.agentvault.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

  private final AuthService authService;
  private final UserService userService;

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  public void changePassword(
      AgentVaultAuthentication authentication, @Valid @RequestBody ChangePasswordRequest request) {

    userService.changePassword(
        (UUID) authentication.getPrincipal(), request.oldPassword(), request.newPassword());
  }

  @PostMapping("/forgot-password")
  public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {

    String token = userService.initiatePasswordReset(request.tenantId(), request.username());

    return Map.of("resetToken", token);
  }

  @PostMapping("/reset-password")
  public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {

    userService.resetPassword(request.token(), request.newPassword());
  }

  @GetMapping("/ping")
  @PreAuthorize("isAuthenticated()")
  public Map<String, Object> ping(AgentVaultAuthentication authentication) {
    return Map.of("message", "pong", "tenantId", authentication.getTenantId());
  }
}
