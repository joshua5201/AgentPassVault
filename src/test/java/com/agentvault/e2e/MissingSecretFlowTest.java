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
package com.agentvault.e2e;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.*;
import com.agentvault.model.RequestStatus;
import com.agentvault.service.AgentService;
import com.agentvault.service.UserService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class MissingSecretFlowTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private AgentService agentService;

  @Test
  void completeMissingSecretFlow() throws Exception {
    // 1. Setup Tenant
    Long tenantId = createTenant();

    // Setup Admin
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken("admin", "password");

    // Setup Agent
    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "deploy-agent");
    String agentAppToken = agentResp.appToken();
    String agentId = agentResp.agentId();

    // Agent Login to get JWT
    String agentLoginResp =
        mockMvc
            .perform(
                post("/api/v1/auth/login/agent")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new AgentLoginRequest(tenantId.toString(), agentAppToken))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String agentJwt = objectMapper.readTree(agentLoginResp).get("accessToken").asText();

    // 1b. Agent registers its public key
    String publicKey = "agent-public-key";
    mockMvc
        .perform(
            post("/api/v1/agents/" + agentId + "/register")
                .header("Authorization", "Bearer " + agentJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterAgentRequest(publicKey))))
        .andExpect(status().isOk());

    // 2. Agent Searches for "Prod DB" (and finds nothing)
    SearchSecretRequest searchReq = new SearchSecretRequest(Map.of("service", "db", "env", "prod"));
    mockMvc
        .perform(
            post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + agentJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));

    // 3. Agent Creates Request
    CreateRequestDTO createReq =
        new CreateRequestDTO(
            "Prod DB Credentials",
            "Need to run migration",
            Map.of("service", "db", "env", "prod"),
            List.of("username", "password"));

    String reqResp =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + agentJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("pending"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String requestId = objectMapper.readTree(reqResp).get("requestId").asText();

    // 4. Admin Checks Request (Verification step, maybe admin lists pending requests)
    mockMvc
        .perform(
            get("/api/v1/requests/" + requestId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("pending"))
        .andExpect(jsonPath("$.name").value("Prod DB Credentials"));

    // 5. Admin Fulfills Request
    // 5a. Create Secret
    CreateSecretRequest createSecretReq =
        new CreateSecretRequest(
            "Prod DB Credentials", "owner-enc-pass", Map.of("service", "db", "env", "prod"));
    String secretResp =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createSecretReq)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String secretId = objectMapper.readTree(secretResp).get("secretId").asText();

    // 5b. Create Lease
    CreateLeaseRequest createLeaseReq =
        new CreateLeaseRequest(agentId, publicKey, "agent-enc-pass", null);
    mockMvc
        .perform(
            post("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createLeaseReq)))
        .andExpect(status().isOk());

    // 5c. Update Request Status
    UpdateRequestDTO fulfillReq = new UpdateRequestDTO(RequestStatus.fulfilled, secretId, null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fulfillReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("fulfilled"));

    // 6. Agent Searches again (Should find it now)
    String searchResp =
        mockMvc
            .perform(
                post("/api/v1/secrets/search")
                    .header("Authorization", "Bearer " + agentJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(searchReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andReturn()
            .getResponse()
            .getContentAsString();

    String foundSecretId = objectMapper.readTree(searchResp).get(0).get("secretId").asText();

    // 7. Agent Gets Secret (Returns encrypted value)
    mockMvc
        .perform(
            get("/api/v1/secrets/" + foundSecretId).header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encryptedValue").value("agent-enc-pass"));
  }

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
}
