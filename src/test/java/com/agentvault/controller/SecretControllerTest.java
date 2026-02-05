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
import com.agentvault.model.Secret;
import com.agentvault.model.SecretVisibility;
import com.agentvault.repository.SecretRepository;
import com.agentvault.service.AgentService;
import com.agentvault.service.UserService;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

@SuppressWarnings("HidingField")
class SecretControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private AgentService agentService;
  @Autowired private SecretRepository secretRepository;

  private String getAuthToken(UUID tenantId, String username, String password) throws Exception {
    String loginResponse =
        mockMvc
            .perform(
                post("/api/v1/auth/login/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new UserLoginRequest(username, password))))
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(loginResponse).get("accessToken").asText();
  }

  @Test
  void createAndGetSecret_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    // Create
    CreateSecretRequest createReq =
        new CreateSecretRequest("DB Pass", "secret123", Map.of("env", "prod"));

    String createResponse =
        mockMvc
            .perform(
                post("/api/v1/secrets")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.secretId").exists())
            .andExpect(jsonPath("$.value").doesNotExist()) // Verify value is NOT returned
            .andReturn()
            .getResponse()
            .getContentAsString();

    String secretId = objectMapper.readTree(createResponse).get("secretId").asText();

    // Get
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.value").value("secret123"))
        .andExpect(jsonPath("$.metadata.env").value("prod"));
  }

  @Test
  void deleteSecret_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

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

    // Get should fail (assumed 500 or 400 for now based on service exception)
    // Service throws IllegalArgumentException -> GlobalExceptionHandler maps to 500 currently
    mockMvc
        .perform(get("/api/v1/secrets/" + secretId).header("Authorization", "Bearer " + token))
        .andExpect(status().isInternalServerError());
  }

  @Test
  void searchSecrets_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

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
    UUID tenantA = createTenant();
    userService.createAdminUser(tenantA, "adminA", "pass");
    String tokenA = getAuthToken(tenantA, "adminA", "pass");

    // Tenant B
    UUID tenantB = createTenant();
    userService.createAdminUser(tenantB, "adminB", "pass");
    String tokenB = getAuthToken(tenantB, "adminB", "pass");

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
  void searchSecrets_RespectsVisibility() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    createSecret(token, "Visible", SecretVisibility.VISIBLE);
    createSecret(token, "LeaseRequired", SecretVisibility.LEASE_REQUIRED);
    createSecret(token, "Hidden", SecretVisibility.HIDDEN);

    mockMvc
        .perform(
            post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SearchSecretRequest(null))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[?(@.name == 'Hidden')]", empty()));
  }

  @Test
  void testGetSecret_HandlesVisibility() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    String leaseId = createSecret(token, "Lease", SecretVisibility.LEASE_REQUIRED);
    String hiddenId = createSecret(token, "Hidden", SecretVisibility.HIDDEN);

    // Attempt to get LEASE_REQUIRED without a lease token should fail
    mockMvc
        .perform(get("/api/v1/secrets/" + leaseId).header("Authorization", "Bearer " + token))
        .andExpect(status().isInternalServerError());

    // Attempt to get HIDDEN should fail
    mockMvc
        .perform(get("/api/v1/secrets/" + hiddenId).header("Authorization", "Bearer " + token))
        .andExpect(status().isInternalServerError());
  }

  @Test
  void testGetSecret_WithLease_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String adminToken = getAuthToken(tenantId, "admin", "password");

    // 1. Create a LEASE_REQUIRED secret
    String secretId = createSecret(adminToken, "Lease Me", SecretVisibility.LEASE_REQUIRED);

    // 2. Agent creates a LEASE request
    String agentJwt = createAgentAndGetJwt(tenantId);
    CreateRequestDTO createReq =
        new CreateRequestDTO(
            "Request for " + secretId,
            "Need lease access",
            null,
            null,
            com.agentvault.model.RequestType.LEASE,
            UUID.fromString(secretId));

    String reqResponse =
        mockMvc
            .perform(
                post("/api/v1/requests")
                    .header("Authorization", "Bearer " + agentJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createReq)))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("requestId").asText();

    // 3. Admin approves the lease
    UpdateRequestDTO approveReq =
        new UpdateRequestDTO(
            UpdateRequestDTO.Action.APPROVE_LEASE, null, null, null, null, null, null);

    String approveResponse =
        mockMvc
            .perform(
                patch("/api/v1/requests/" + requestId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(approveReq)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String leaseToken = objectMapper.readTree(approveResponse).get("leaseToken").asText();

    // 4. Agent uses lease token to get the secret
    mockMvc
        .perform(
            get("/api/v1/secrets/" + secretId + "?leaseToken=" + leaseToken)
                .header("Authorization", "Bearer " + agentJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.value").value("secret_value"));
  }

  // Helper methods
  private String createSecret(String token, String name, SecretVisibility visibility)
      throws Exception {
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

    String secretId = objectMapper.readTree(createResponse).get("secretId").asText();

    // Manually update visibility as there is no API for it
    Secret secret = secretRepository.findBySecretId(UUID.fromString(secretId)).get();
    secret.setVisibility(visibility);
    secretRepository.save(secret);

    return secretId;
  }

  private String createAgentAndGetJwt(UUID tenantId) throws Exception {
    AgentTokenResponse agentResp = agentService.createAgent(tenantId, "test-agent");
    String agentAppToken = agentResp.appToken();

    String agentLoginResp =
        mockMvc
            .perform(
                post("/api/v1/auth/login/agent")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new AgentLoginRequest(tenantId, agentAppToken))))
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(agentLoginResp).get("accessToken").asText();
  }
}
