/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agentpassvault.BaseIntegrationTest;
import com.agentpassvault.dto.CreateSecretRequest;
import com.agentpassvault.dto.UserLoginRequest;
import com.agentpassvault.service.UserService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class IdempotencyTest extends BaseIntegrationTest {

  @Autowired private UserService userService;

  @Test
  void testIdempotency_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");

    // Login to get token
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new UserLoginRequest("admin", "password"))))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

    String idempotencyKey = UUID.randomUUID().toString();
    CreateSecretRequest request = new CreateSecretRequest("Idempotent Secret", "val", null);

    // First request
    String firstResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .header("Idempotency-Key", idempotencyKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    // Second request with same key
    String secondResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .header("Idempotency-Key", idempotencyKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    assertEquals(firstResponse, secondResponse);

    // Verify only one secret created in DB
    assertEquals(1, secretRepository.count());
  }
}
