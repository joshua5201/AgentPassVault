/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentpassvault.BaseIntegrationTest;
import com.agentpassvault.dto.CreateAgentRequest;
import com.agentpassvault.dto.UserLoginRequest;
import com.agentpassvault.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class AgentControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;

  private String getAuthToken(String username, String password) throws Exception {
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new UserLoginRequest(username, password))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }

  @Test
  void createAndListAgent_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    // Create Agent
    CreateAgentRequest createReq = new CreateAgentRequest("CI Runner");
    mockMvc
        .perform(
            post("/api/v1/agents")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.agentId").exists())
        .andExpect(jsonPath("$.appToken").exists());

    // List Agents
    mockMvc
        .perform(get("/api/v1/agents").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value(startsWith("agent-")));
  }

  @Test
  void rotateToken_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    // Create Agent
    CreateAgentRequest createReq = new CreateAgentRequest("Agent 1");
    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/agents")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String agentId = objectMapper.readTree(createResponse).get("agentId").asText();
    String oldToken = objectMapper.readTree(createResponse).get("appToken").asText();

    // Rotate
    mockMvc
        .perform(
            post("/api/v1/agents/" + agentId + "/rotate")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.appToken").value(not(oldToken)));
  }

  @Test
  void deleteAgent_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    // Create Agent
    CreateAgentRequest createReq = new CreateAgentRequest("Agent 1");
    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/agents")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String agentId = objectMapper.readTree(createResponse).get("agentId").asText();

    // Delete
    mockMvc
        .perform(delete("/api/v1/agents/" + agentId).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    // List should be empty
    mockMvc
        .perform(get("/api/v1/agents").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }
}
