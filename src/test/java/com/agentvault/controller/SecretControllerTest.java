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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.*;
import com.agentvault.model.RequestType;
import com.agentvault.service.AgentService;
import com.agentvault.service.UserService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@SuppressWarnings("HidingField")
class SecretControllerTest extends BaseIntegrationTest {

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

  @Test
  void createAndGetSecret_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    // Create
    CreateSecretRequest createReq =
        new CreateSecretRequest("DB Pass", "encrypted-secret-123", Map.of("env", "prod"));

    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.secretId").exists())
            .andExpect(
                jsonPath("$.encryptedValue")
                    .doesNotExist()) // Verify encryptedValue is NOT returned in metadata
            .andReturn()
            .getResponse()
            .getContentAsString();

    String secretId = objectMapper.readTree(createResponse).get("secretId").asText();

    // Get
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encryptedValue").value("encrypted-secret-123"))
        .andExpect(jsonPath("$.metadata.env").value("prod"));
  }

  @Test
  void deleteSecret_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    CreateSecretRequest createReq = new CreateSecretRequest("Delete Me", "val", null);
    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String secretId = objectMapper.readTree(createResponse).get("secretId").asText();

    // Delete
    mockMvc
        .perform(delete("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    // Get should fail
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + token))
        .andExpect(status().isInternalServerError());
  }

  @Test
  void searchSecrets_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    // Create two secrets
    mockMvc.perform(
        post("/api/v1/secrets")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new CreateSecretRequest("S1", "v1", Map.of("env", "prod", "app", "web")))));

    mockMvc.perform(
        post("/api/v1/secrets")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new CreateSecretRequest("S2", "v2", Map.of("env", "dev", "app", "web")))));

    // Search for env=prod
    SearchSecretRequest searchProd = new SearchSecretRequest(Map.of("env", "prod"));
    mockMvc
        .perform(
            post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchProd)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("S1"))
        .andExpect(jsonPath("$[0].value").doesNotExist()); // Verify value is NOT returned

    // Search for app=web
    SearchSecretRequest searchWeb = new SearchSecretRequest(Map.of("app", "web"));
    mockMvc
        .perform(
            post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchWeb)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)));
  }

  @Test
  void crossTenantAccess_Denied() throws Exception {
    // Tenant A
    Long tenantA = createTenant();
    userService.createAdminUser(tenantA, "adminA", "pass");
    String tokenA = getAuthToken("adminA", "pass");

    // Tenant B
    Long tenantB = createTenant();
    userService.createAdminUser(tenantB, "adminB", "pass");
    String tokenB = getAuthToken("adminB", "pass");

    // A creates secret
    CreateSecretRequest createReq = new CreateSecretRequest("Secret A", "valA", null);
    String response =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String secretId = objectMapper.readTree(response).get("secretId").asText();

    // B tries to get it
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + tokenB))
        .andExpect(status().isInternalServerError()); // NotFound exception
  }

  @Test
  void testGetSecret_WithLease_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken("admin", "password");

    // 1. Create a secret
    String secretId = createSecret(adminToken, "Lease Me");

    // 2. Create Agent and get ID/Token
    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "test-agent");
    String agentAppToken = agentResp.appToken();
    String agentId = agentResp.agentId();

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
    String agentJwt = objectMapper.readTree(agentLoginResp).get("accessToken").asText();

    // 3. Agent registers its public key
    String publicKey = "test-public-key";
    mockMvc
        .perform(
            post("/api/v1/agents/" + agentId + "/register")
                .header("Authorization", "Bearer " + agentJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterAgentRequest(publicKey))))
        .andExpect(status().isOk());

    // 4. Agent creates a LEASE request
    CreateRequestDTO createReq =
        new CreateRequestDTO(
            "Request for " + secretId,
            "Need lease access",
            null,
            null,
            com.agentvault.model.RequestType.LEASE,
            secretId);

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

    // 5. Admin creates the lease
    CreateLeaseRequest leaseReq =
        new CreateLeaseRequest(agentId, publicKey, "agent_encrypted_val", null);
    mockMvc
        .perform(
            post("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leaseReq)))
        .andExpect(status().isOk());

    // 6. Admin fulfills the request (updates status)
    UpdateRequestDTO fulfillReq =
        new UpdateRequestDTO(com.agentvault.model.RequestStatus.fulfilled, secretId, null);

    mockMvc
        .perform(
            patch("/api/v1/requests/" + requestId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fulfillReq)))
        .andExpect(status().isOk());

    // 7. Agent gets the secret
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.encryptedValue").value("agent_encrypted_val"));
  }

  @Test
  void updateSecret_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    String secretId = createSecret(token, "Original Name");

    // Update name and metadata
    UpdateSecretRequest updateReq =
        new UpdateSecretRequest("Updated Name", null, Map.of("new", "meta"), null);

    mockMvc
        .perform(
            patch("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Updated Name"))
        .andExpect(jsonPath("$.metadata.new").value("meta"));
  }

  @Test
  void listAndRevokeLeases_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    String secretId = createSecret(token, "Secret");

    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "agent-1");
    String agentId = agentResp.agentId();

    // Create Lease
    CreateLeaseRequest leaseReq =
        new CreateLeaseRequest(agentId, "pubkey", "encdata", null);
    mockMvc
        .perform(
            post("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leaseReq)))
        .andExpect(status().isOk());

    // List Leases
    mockMvc
        .perform(
            get("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].agentId").value(agentId));

    // Revoke Lease
    mockMvc
        .perform(
            delete("/api/v1/secrets/" + secretId + "/leases/" + agentId)
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    // List Leases should be empty
    mockMvc
        .perform(
            get("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void updateSecret_WithEncryptedValue_DeletesLeases() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken("admin", "password");

    String secretId = createSecret(token, "Secret");

    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "agent-1");
    String agentId = agentResp.agentId();

    // Create Lease
    CreateLeaseRequest leaseReq =
        new CreateLeaseRequest(agentId, "pubkey", "encdata", null);
    mockMvc
        .perform(
            post("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leaseReq)))
        .andExpect(status().isOk());

    // Verify lease exists
    mockMvc
        .perform(
            get("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)));

    // Update secret encrypted value
    UpdateSecretRequest updateReq =
        new UpdateSecretRequest(null, "new-encrypted-value", null, null);

    mockMvc
        .perform(
            patch("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
        .andExpect(status().isOk());

    // Verify lease is deleted
    mockMvc
        .perform(
            get("/api/v1/secrets/" + secretId + "/leases")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  // Helper methods
  private String createSecret(String token, String name) throws Exception {
    CreateSecretRequest createReq = new CreateSecretRequest(name, "secret_value", null);
    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(createResponse).get("secretId").asText();
  }
}
