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
import com.agentpassvault.dto.*;
import com.agentpassvault.service.AgentService;
import com.agentpassvault.service.UserService;
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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

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
        .andExpect(status().isNotFound());
  }

  @Test
  void searchSecrets_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

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
    SearchSecretRequest searchProd = new SearchSecretRequest(null, Map.of("env", "prod"));
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
    SearchSecretRequest searchWeb = new SearchSecretRequest(null, Map.of("app", "web"));
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
    userService.createAdminUser(tenantA, "adminA@example.com", "pass");
    String tokenA = getAuthToken("adminA@example.com", "pass");

    // Tenant B
    Long tenantB = createTenant();
    userService.createAdminUser(tenantB, "adminB@example.com", "pass");
    String tokenB = getAuthToken("adminB@example.com", "pass");

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
        .andExpect(status().isNotFound()); // NotFound exception
  }

  @Test
  void testGetSecret_WithLease_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String adminToken = getAuthToken("admin@example.com", "password");

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
    CreateRequestRequest createReq =
        new CreateRequestRequest(
            "Request for " + secretId,
            "Need lease access",
            null,
            null,
            com.agentpassvault.model.RequestType.LEASE,
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
    UpdateRequestRequest fulfillReq =
        new UpdateRequestRequest(com.agentpassvault.model.RequestStatus.fulfilled, secretId, null);

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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    String secretId = createSecret(token, "Secret");

    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "agent-1");
    String agentId = agentResp.agentId();

    // Create Lease
    CreateLeaseRequest leaseReq = new CreateLeaseRequest(agentId, "pubkey", "encdata", null);
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
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    String secretId = createSecret(token, "Secret");

    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "agent-1");
    String agentId = agentResp.agentId();

    // Create Lease
    CreateLeaseRequest leaseReq = new CreateLeaseRequest(agentId, "pubkey", "encdata", null);
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

  @Test
  void listSecrets_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String adminToken = getAuthToken("admin@example.com", "password");

    // 1. Create two secrets and get the ID of the first one
    String secretId1 = createSecret(adminToken, "Secret 1");
    createSecret(adminToken, "Secret 2");

    // 2. Create Agent and get token
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

    // 3. Register public key for agent
    String publicKey = "test-public-key";
    mockMvc
        .perform(
            post("/api/v1/agents/" + agentId + "/register")
                .header("Authorization", "Bearer " + agentJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterAgentRequest(publicKey))))
        .andExpect(status().isOk());

    // 4. Create lease for secret 1 only
    CreateLeaseRequest leaseReq =
        new CreateLeaseRequest(
            agentId, publicKey, "agent_encrypted_val", java.time.Instant.now().plusSeconds(3600));
    mockMvc
        .perform(
            post("/api/v1/secrets/" + secretId1 + "/leases")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(leaseReq)))
        .andExpect(status().isOk());

    // 5. Test Admin List
    mockMvc
        .perform(get("/api/v1/secrets").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("\"name\":\"Secret 1\"")))
        .andExpect(content().string(containsString("\"name\":\"Secret 2\"")))
        .andExpect(content().string(containsString("\"agentId\":\"" + agentId + "\"")))
        .andExpect(content().string(containsString("\"agentDisplayName\":\"test-agent\"")))
        .andExpect(
            content().string(not(containsString("\"name\":\"Secret 2\",\"activeLeases\":[{\""))));

    // 6. Test Agent List
    mockMvc
        .perform(get("/api/v1/secrets").header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("\"name\":\"Secret 1\"")))
        .andExpect(content().string(containsString("\"name\":\"Secret 2\"")))
        .andExpect(content().string(containsString("\"publicKey\":\"" + publicKey + "\"")))
        .andExpect(
            content().string(not(containsString("\"name\":\"Secret 2\",\"activeLeases\":[{\""))));
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
