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
import com.agentvault.model.Tenant;
import com.agentvault.service.AgentService;
import com.agentvault.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class MissingSecretFlowTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private AgentService agentService;

  @Test
  void completeMissingSecretFlow() throws Exception {
    // 1. Setup Tenant
    UUID tenantId = UUID.randomUUID();
    Tenant tenant = new Tenant();
    tenant.setTenantId(tenantId);
    tenant.setName("E2E Tenant");
    tenant.setStatus("active");
    tenant.setEncryptedTenantKey(keyManagementService.generateEncryptedTenantKey());
    tenantRepository.save(tenant);

    // Setup Admin
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken(tenantId, "admin", "password");

    // Setup Agent
    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "deploy-agent");
    String agentAppToken = agentResp.appToken();

    // Agent Login to get JWT
    String agentLoginResp =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest(tenantId, null, null, agentAppToken))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String agentJwt = objectMapper.readTree(agentLoginResp).get("accessToken").asText();

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

    String requestId = objectMapper.readTree(reqResp).get("id").asText();

    // 4. Admin Checks Request (Verification step, maybe admin lists pending requests)
    mockMvc
        .perform(
            get("/api/v1/requests/" + requestId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("pending"))
        .andExpect(jsonPath("$.name").value("Prod DB Credentials"));

    // 5. Admin Fulfills Request
    UpdateRequestDTO fulfillReq =
        new UpdateRequestDTO(
            UpdateRequestDTO.Action.FULFILL,
            "Prod DB Credentials",
            "super-secret-password",
            Map.of("service", "db", "env", "prod"),
            null,
            null,
            null);

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

    String secretId = objectMapper.readTree(searchResp).get(0).get("id").asText();

    // 7. Agent Gets Secret (Decrypts)
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.value").value("super-secret-password"));
  }

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
}
