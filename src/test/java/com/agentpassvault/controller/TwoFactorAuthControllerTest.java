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
import com.agentpassvault.service.TwoFactorAuthService;
import com.agentpassvault.service.UserService;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class TwoFactorAuthControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private TwoFactorAuthService twoFactorAuthService;

  @Test
  void totp_FullFlow_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "2fa_user", "password");

    // 1. Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new UserLoginRequest("2fa_user", "password"))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

    // 2. Get TOTP setup
    String setupResponse =
        mockMvc
            .perform(get("/api/v1/auth/2fa/totp/setup").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.secret").exists())
            .andExpect(jsonPath("$.qrCodeUrl").exists())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String secret = objectMapper.readTree(setupResponse).get("secret").asText();

    // 3. Enable TOTP with valid code
    CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
    String code = codeGenerator.generate(secret, new SystemTimeProvider().getTime() / 30);

    mockMvc
        .perform(
            post("/api/v1/auth/2fa/totp/enable")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new TotpVerifyRequest(code, secret))))
        .andExpect(status().isOk());

    // 4. Try login without 2FA - should fail with TWO_FACTOR_REQUIRED
    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new UserLoginRequest("2fa_user", "password"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("TWO_FACTOR_REQUIRED"));

    // 5. Login with 2FA
    String code2 = codeGenerator.generate(secret, new SystemTimeProvider().getTime() / 30);
    mockMvc
        .perform(
            post("/api/v1/auth/login/user/2fa")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new TwoFactorLoginRequest("2fa_user", "password", code2))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").exists());

    // 6. Disable TOTP
    mockMvc
        .perform(
            post("/api/v1/auth/2fa/totp/disable")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());

    // 7. Login again without 2FA - should succeed
    mockMvc
        .perform(
            post("/api/v1/auth/login/user")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new UserLoginRequest("2fa_user", "password"))))
        .andExpect(status().isOk());
  }
}
