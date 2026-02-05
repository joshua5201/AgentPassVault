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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.ChangePasswordRequest;
import com.agentvault.dto.ForgotPasswordRequest;
import com.agentvault.dto.LoginRequest;
import com.agentvault.dto.ResetPasswordRequest;
import com.agentvault.model.Tenant;
import com.agentvault.service.UserService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class AuthControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;

  private void createTenant(UUID id) {
    Tenant tenant = new Tenant();
    tenant.setId(id);
    tenant.setName("Test Tenant");
    tenant.setStatus("active");
    tenantRepository.save(tenant);
  }

  @Test
  void changePassword_WithValidCredentials_Success() throws Exception {
    UUID tenantId = UUID.randomUUID();
    createTenant(tenantId);

    // Create user with known password
    userService.createAdminUser(tenantId, "change_pass_user", "oldPass123");

    // Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest(tenantId, "change_pass_user", "oldPass123", null))))
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
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new LoginRequest(tenantId, "change_pass_user", "newPass456", null))))
        .andExpect(status().isOk());
  }

  @Test
  void forgotAndResetPassword_Flow_Success() throws Exception {
    UUID tenantId = UUID.randomUUID();
    createTenant(tenantId);
    userService.createAdminUser(tenantId, "reset_user", "oldPass");

    // 1. Forgot Password
    ForgotPasswordRequest forgotReq = new ForgotPasswordRequest(tenantId, "reset_user");

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
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new LoginRequest(tenantId, "reset_user", "newPass789", null))))
        .andExpect(status().isOk());
  }

  @Test
  void ping_WithoutToken_Returns401() throws Exception {
    mockMvc.perform(get("/api/v1/auth/ping")).andExpect(status().isUnauthorized());
  }

  @Test
  void ping_WithValidToken_ReturnsPong() throws Exception {
    UUID tenantId = UUID.randomUUID();
    createTenant(tenantId);

    userService.createAdminUser(tenantId, "testuser", "password");

    // Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest(tenantId, "testuser", "password", null))))
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
        .andExpect(jsonPath("$.role").value("admin"));
  }

  @Test
  void login_WithValidAdminCredentials_ReturnsToken() throws Exception {
    UUID tenantId = UUID.randomUUID();
    createTenant(tenantId);

    userService.createAdminUser(tenantId, "admin", "password");

    LoginRequest request = new LoginRequest(tenantId, "admin", "password", null);

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists())
        .andExpect(jsonPath("$.tokenType").value("Bearer"));
  }

  @Test
  void login_WithValidAgentToken_ReturnsToken() throws Exception {
    UUID tenantId = UUID.randomUUID();
    createTenant(tenantId);

    String rawToken = "agent-token-123";

    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
    String tokenHash = Base64.getEncoder().encodeToString(hash);

    userService.createAgentUser(tenantId, tokenHash);

    LoginRequest request = new LoginRequest(tenantId, null, null, rawToken);

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists());
  }

  @Test
  void login_WithInvalidCredentials_Returns401() throws Exception {
    LoginRequest request = new LoginRequest(UUID.randomUUID(), "wrong", "wrong", null);

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isUnauthorized());
  }
}
