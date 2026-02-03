package com.agentvault.controller;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.LoginRequest;
import com.agentvault.model.User;
import com.agentvault.model.Tenant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest extends BaseIntegrationTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    private void createTenant(UUID id) {
        Tenant tenant = new Tenant();
        tenant.setId(id);
        tenant.setName("Test Tenant");
        tenant.setStatus("active");
        tenantRepository.save(tenant);
    }

    @Test
    void ping_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/ping"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ping_WithValidToken_ReturnsPong() throws Exception {
        UUID tenantId = UUID.randomUUID();
        createTenant(tenantId);
        
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setUsername("testuser");
        user.setPasswordHash(passwordEncoder.encode("password"));
        user.setRole("admin");
        userRepository.save(user);

        // Login to get token
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(tenantId, "testuser", "password", null))))
                .andReturn().getResponse().getContentAsString();
        
        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/ping")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("pong"))
                .andExpect(jsonPath("$.tenantId").value(tenantId.toString()));
    }

    @Test
    void login_WithValidAdminCredentials_ReturnsToken() throws Exception {
        UUID tenantId = UUID.randomUUID();
        createTenant(tenantId);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setUsername("admin");
        user.setPasswordHash(passwordEncoder.encode("password"));
        user.setRole("admin");
        userRepository.save(user);

        LoginRequest request = new LoginRequest(tenantId, "admin", "password", null);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void login_WithValidAgentToken_ReturnsToken() throws Exception {
        UUID tenantId = UUID.randomUUID();
        createTenant(tenantId);

        String rawToken = "agent-token-123";
        
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
        String tokenHash = Base64.getEncoder().encodeToString(hash);

        User agent = new User();
        agent.setId(UUID.randomUUID());
        agent.setTenantId(tenantId);
        agent.setRole("agent");
        agent.setAppTokenHash(tokenHash);
        userRepository.save(agent);

        LoginRequest request = new LoginRequest(tenantId, null, null, rawToken);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void login_WithInvalidCredentials_Returns401() throws Exception {
        LoginRequest request = new LoginRequest(UUID.randomUUID(), "wrong", "wrong", null);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
