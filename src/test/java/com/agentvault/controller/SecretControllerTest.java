package com.agentvault.controller;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.LoginRequest;
import com.agentvault.dto.SearchSecretRequest;
import com.agentvault.model.Tenant;
import com.agentvault.service.UserService;
import com.agentvault.service.crypto.KeyManagementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecretControllerTest extends BaseIntegrationTest {

    @Autowired
    private UserService userService;
    @Autowired
    private KeyManagementService keyManagementService;

    private String getAuthToken(UUID tenantId, String username, String password) throws Exception {
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(tenantId, username, password, null))))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }

    private UUID createTenant() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("Test Tenant");
        tenant.setStatus("active");
        tenant.setEncryptedTenantKey(keyManagementService.generateEncryptedTenantKey());
        tenantRepository.save(tenant);
        return tenantId;
    }

    @Test
    void createAndGetSecret_Success() throws Exception {
        UUID tenantId = createTenant();
        userService.createAdminUser(tenantId, "admin", "password");
        String token = getAuthToken(tenantId, "admin", "password");

        // Create
        CreateSecretRequest createReq = new CreateSecretRequest("DB Pass", "secret123", Map.of("env", "prod"));
        
        String createResponse = mockMvc.perform(post("/api/v1/secrets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.value").value("secret123")) // Should return decrypted
                .andReturn().getResponse().getContentAsString();
        
        String secretId = objectMapper.readTree(createResponse).get("id").asText();

        // Get
        mockMvc.perform(get("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + token))
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
        String createResponse = mockMvc.perform(post("/api/v1/secrets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andReturn().getResponse().getContentAsString();
        String secretId = objectMapper.readTree(createResponse).get("id").asText();

        // Delete
        mockMvc.perform(delete("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Get should fail (assumed 500 or 400 for now based on service exception)
        // Service throws IllegalArgumentException -> GlobalExceptionHandler maps to 500 currently
        mockMvc.perform(get("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void searchSecrets_Success() throws Exception {
        UUID tenantId = createTenant();
        userService.createAdminUser(tenantId, "admin", "password");
        String token = getAuthToken(tenantId, "admin", "password");

        // Create two secrets
        mockMvc.perform(post("/api/v1/secrets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateSecretRequest("S1", "v1", Map.of("env", "prod", "app", "web")))));

        mockMvc.perform(post("/api/v1/secrets")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateSecretRequest("S2", "v2", Map.of("env", "dev", "app", "web")))));

        // Search for env=prod
        SearchSecretRequest searchProd = new SearchSecretRequest(Map.of("env", "prod"));
        mockMvc.perform(post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchProd)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("S1"));

        // Search for app=web
        SearchSecretRequest searchWeb = new SearchSecretRequest(Map.of("app", "web"));
        mockMvc.perform(post("/api/v1/secrets/search")
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
        String response = mockMvc.perform(post("/api/v1/secrets")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andReturn().getResponse().getContentAsString();
        String secretId = objectMapper.readTree(response).get("id").asText();

        // B tries to get it
        mockMvc.perform(get("/api/v1/secrets/" + secretId)
                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isInternalServerError()); // NotFound exception
    }
}
