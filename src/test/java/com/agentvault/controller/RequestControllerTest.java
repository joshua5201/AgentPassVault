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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.*;
import com.agentvault.model.SecretVisibility;
import com.agentvault.repository.SecretRepository;
import com.agentvault.service.AgentService;
import com.agentvault.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class RequestControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private AgentService agentService;
  @Autowired private SecretRepository secretRepository;

  private String getAuthToken(UUID tenantId, String username, String password) throws Exception {
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest(tenantId, username, password, null))))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }

  private String createAgentAndGetJwt(UUID tenantId) throws Exception {
    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "test-agent");
    String agentAppToken = agentResp.appToken();

    String agentLoginResp =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest(tenantId, null, null, agentAppToken))))
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(agentLoginResp).get("accessToken").asText();
  }

  @Test
  void createAndFulfillRequest_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    // 1. Create Request
    CreateRequestDTO createReq =
        new CreateRequestDTO(
            "AWS Creds", "Need for deploy", Map.of("service", "aws"), List.of("key", "secret"));

    String reqResponse =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("pending"))
            .andExpect(jsonPath("$.requestId").exists())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();

    // 2. Fulfill Request
    UpdateRequestDTO fulfillReq =
        new UpdateRequestDTO(
            UpdateRequestDTO.Action.FULFILL,
            "AWS Secret",
            "secretVal",
            Map.of("env", "prod"),
            null,
            null,
            null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fulfillReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("fulfilled"))
        .andExpect(jsonPath("$.mappedSecretId").exists());
  }

  @Test
  void rejectRequest_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    CreateRequestDTO createReq = new CreateRequestDTO("Bad Req", "Context", null, null);
    String reqResponse =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();

    UpdateRequestDTO rejectReq =
        new UpdateRequestDTO(
            UpdateRequestDTO.Action.REJECT, null, null, null, null, null, "Denied");

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("rejected"))
        .andExpect(jsonPath("$.rejectionReason").value("Denied"));
  }

  @Test
  void abandonRequest_Success() throws Exception {
    UUID tenantId = createTenant();
    String agentJwt = createAgentAndGetJwt(tenantId);

    // 1. Create Request as Agent
    CreateRequestDTO createReq = new CreateRequestDTO("Agent Req", "Context", null, null);
    String reqResponse =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + agentJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();

    // 2. Abandon Request as Agent
    mockMvc
        .perform(
            delete("/api/v1/requests/" + requestId).header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isNoContent());

    // 3. Verify status is abandoned
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken(tenantId, "admin", "password");
    mockMvc
        .perform(
            get("/api/v1/requests/" + requestId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("abandoned"));
  }

  @Test
  void mapRequest_WithNewVisibility_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken(tenantId, "admin", "password");

    // 1. Create a HIDDEN secret
    CreateSecretRequest createSecretReq =
        new CreateSecretRequest("Hidden Secret", "hiddenVal", null);
    String secretResp =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createSecretReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String secretId = objectMapper.readTree(secretResp).get("secretId").asText();

    com.agentvault.model.Secret secret = secretRepository.findBySecretId(UUID.fromString(secretId)).get();
    secret.setVisibility(SecretVisibility.HIDDEN);
    secretRepository.save(secret);

    // 2. Create Request for it
    CreateRequestDTO createReq = new CreateRequestDTO("Reveal Secret", "Context", null, null);
    String reqResponse =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();

    // 3. Map Request and change visibility to VISIBLE
    UpdateRequestDTO mapReq =
        new UpdateRequestDTO(
            UpdateRequestDTO.Action.MAP,
            null,
            null,
            null,
            UUID.fromString(secretId),
            SecretVisibility.VISIBLE,
            null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("fulfilled"))
        .andExpect(jsonPath("$.mappedSecretId").value(secretId));

    // 4. Verify secret is now VISIBLE
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.visibility").value("VISIBLE"));
  }
}
