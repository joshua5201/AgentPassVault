/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentpassvault.BaseIntegrationTest;
import com.agentpassvault.dto.*;
import com.agentpassvault.service.UserService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class AuthControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;

  @Test
  void changePassword_WithValidCredentials_Success() throws Exception {
    Long tenantId = createTenant();

    // Create user with known password
    userService.createAdminUser(tenantId, "change_pass_user@example.com", "oldPass123");

    // Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new UserLoginRequest("change_pass_user@example.com", "oldPass123"))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

    // Change password
    ChangePasswordRequest request = new ChangePasswordRequest("oldPass123", "newPass456");

    mockMvc
        .perform(
            post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());

    // Verify new password by logging in
    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new UserLoginRequest("change_pass_user@example.com", "newPass456"))))
        .andExpect(status().isOk());
  }

  @Test
  void forgotAndResetPassword_Flow_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "reset_user@example.com", "oldPass");

    // 1. Forgot Password
    ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("reset_user@example.com");

    String response =
        mockMvc
            .perform(
                post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(forgotReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resetToken").exists())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String resetToken = objectMapper.readTree(response).get("resetToken").asText();

    // 2. Reset Password
    ResetPasswordRequest resetReq = new ResetPasswordRequest(resetToken, "newPass789");

    mockMvc
        .perform(
            post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetReq)))
        .andExpect(status().isOk());

    // 3. Login with new password
    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new UserLoginRequest("reset_user@example.com", "newPass789"))))
        .andExpect(status().isOk());
  }

  @Test
  void resetPassword_TokenIssuedBeforeLastUpdate_ReturnsError() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "security_user@example.com", "pass");

    // 1. Forgot Password -> get token
    String token =
        objectMapper
            .readTree(
                mockMvc
                    .perform(
                        post("/api/v1/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(
                                objectMapper.writeValueAsString(
                                    new ForgotPasswordRequest("security_user@example.com"))))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString())
            .get("resetToken")
            .asText();

    // 2. Manually simulate password update AFTER token was issued
    com.agentpassvault.model.User user = userRepository.findByUsername("security_user@example.com").get();
    user.setPasswordLastUpdatedAt(java.time.Instant.now().plusSeconds(1));
    userRepository.save(user);

    // 3. Attempt to reset password with the now "old" token
    mockMvc
        .perform(
            post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new com.agentpassvault.dto.ResetPasswordRequest(token, "newpass"))))
        .andExpect(status().isInternalServerError());
  }

  @Test
  void ping_WithoutToken_Returns401() throws Exception {
    mockMvc.perform(get("/api/v1/auth/ping")).andExpect(status().isUnauthorized());
  }

  @Test
  void ping_WithValidToken_ReturnsPong() throws Exception {
    Long tenantId = createTenant();

    userService.createAdminUser(tenantId, "testuser@example.com", "password");

    // Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new UserLoginRequest("testuser@example.com", "password"))))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

    mockMvc
        .perform(get("/api/v1/auth/ping").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("pong"))
        .andExpect(jsonPath("$.tenantId").value(tenantId.toString()))
        .andExpect(jsonPath("$.userId").exists())
        .andExpect(jsonPath("$.role").value("ADMIN"));
  }

  @Test
  void login_WithValidAdminCredentials_ReturnsToken() throws Exception {
    Long tenantId = createTenant();

    userService.createAdminUser(tenantId, "admin@example.com", "password");

    UserLoginRequest request = new UserLoginRequest("admin@example.com", "password");

    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.refreshTokenExpiresIn").exists());
  }

  @Test
  void login_WithValidAgentToken_ReturnsToken() throws Exception {
    Long tenantId = createTenant();

    String rawToken = "agent-token-123";

    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
    String tokenHash = Base64.getEncoder().encodeToString(hash);

    userService.createAgentUser(tenantId, tokenHash);

    AgentLoginRequest request = new AgentLoginRequest(tenantId.toString(), rawToken);

    mockMvc
        .perform(
            post("/api/v1/auth/login/agent")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.refreshTokenExpiresIn").exists());
  }

  @Test
  void login_WithInvalidCredentials_Returns401() throws Exception {
    UserLoginRequest request = new UserLoginRequest("wrong@example.com", "wrong@example.com");

    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void refreshToken_WithValidToken_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "refresh_user@example.com", "password");

    // 1. Login to get refresh token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new UserLoginRequest("refresh_user@example.com", "password"))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String refreshToken = objectMapper.readTree(loginResponse).get("refreshToken").asText();

    // 2. Refresh token
    RefreshTokenRequest refreshRequest = new RefreshTokenRequest(refreshToken);

    mockMvc
        .perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.refreshToken").exists())
        .andExpect(jsonPath("$.refreshTokenExpiresIn").exists());
  }

  @Test
  void refreshToken_WithInvalidToken_Returns401() throws Exception {
    RefreshTokenRequest refreshRequest = new RefreshTokenRequest("invalid_token");

    mockMvc
        .perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
        .andExpect(status().isUnauthorized());
  }
}
