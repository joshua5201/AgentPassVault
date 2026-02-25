/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agentpassvault.BaseIntegrationTest;
import com.agentpassvault.dto.*;
import com.agentpassvault.model.RequestStatus;
import com.agentpassvault.service.AgentService;
import com.agentpassvault.service.UserService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class RequestControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private AgentService agentService;

  private String getAuthToken(String username, String password) throws Exception {
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new UserLoginRequest(username, password))))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }

  private AgentTokenResponse createAgentAndGetJwt(Long tenantId) throws Exception {
    return agentService.createAgent(tenantId, "test-agent");
  }

  private String getAgentJwt(Long tenantId, String agentAppToken) throws Exception {
    String agentLoginResp =
        mockMvc
            .perform(
                post("/api/v1/auth/login/agent")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new AgentLoginRequest(tenantId.toString(), agentAppToken))))
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(agentLoginResp).get("accessToken").asText();
  }

  @Test
  void createAndFulfillRequest_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    // 1. Create Request
    CreateRequestRequest createReq =
        new CreateRequestRequest(
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
            .andExpect(jsonPath("$.fulfillmentUrl").exists())
            .andExpect(jsonPath("$.fulfillmentUrl").isString())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();
    String fulfillmentUrl = objectMapper.readTree(reqResponse).get("fulfillmentUrl").asText();
    assert fulfillmentUrl.endsWith(requestId);

    // 2. Create Secret
    CreateSecretRequest createSecretReq =
        new CreateSecretRequest("AWS Secret", "ownerEncVal", Map.of("env", "prod"));
    String secretResp =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createSecretReq)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String secretId = objectMapper.readTree(secretResp).get("secretId").asText();

    // 3. Fulfill Request (Update status and link secret)
    UpdateRequestRequest fulfillReq =
        new UpdateRequestRequest(RequestStatus.fulfilled, secretId, null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fulfillReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("fulfilled"))
        .andExpect(jsonPath("$.mappedSecretId").value(secretId));
  }

  @Test
  void rejectRequest_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    CreateRequestRequest createReq = new CreateRequestRequest("Bad Req", "Context", null, null);
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

    UpdateRequestRequest rejectReq =
        new UpdateRequestRequest(RequestStatus.rejected, null, "Denied");

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
    Long tenantId = createTenant();
    AgentTokenResponse agentTokenResp = createAgentAndGetJwt(tenantId);
    String agentJwt = getAgentJwt(tenantId, agentTokenResp.appToken());

    // 1. Create Request as Agent
    CreateRequestRequest createReq = new CreateRequestRequest("Agent Req", "Context", null, null);
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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String adminToken = getAuthToken("admin@example.com", "password");
    mockMvc
        .perform(
            get("/api/v1/requests/" + requestId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("abandoned"));
  }

  @Test
  void mapRequest_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String adminToken = getAuthToken("admin@example.com", "password");

    // 1. Create a secret
    CreateSecretRequest createSecretReq = new CreateSecretRequest("Test Secret", "val", null);
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

    // 2. Create Request for it
    CreateRequestRequest createReq =
        new CreateRequestRequest("Reveal Secret", "Context", null, null);
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

    // 3. Map Request (Same as Fulfill in new API, just linking existing secret)
    UpdateRequestRequest mapReq = new UpdateRequestRequest(RequestStatus.fulfilled, secretId, null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("fulfilled"))
        .andExpect(jsonPath("$.mappedSecretId").value(secretId));
  }
}
