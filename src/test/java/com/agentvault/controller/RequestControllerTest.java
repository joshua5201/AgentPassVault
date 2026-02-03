package com.agentvault.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.*;
import com.agentvault.model.Tenant;
import com.agentvault.service.UserService;
import com.agentvault.service.crypto.KeyManagementService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class RequestControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;
  @Autowired private KeyManagementService keyManagementService;

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
  void createAndFulfillRequest_Success() throws Exception {
    UUID tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin", "password");
    String token = getAuthToken(tenantId, "admin", "password");

    // 1. Create Request
    CreateRequestDTO createReq =
        new CreateRequestDTO(
            "AWS Creds", "Need for deploy", Map.of("service", "aws"), List.of("key", "secret"));

        
        String reqResponse = mockMvc.perform(post("/api/v1/requests")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"))
                .andReturn().getResponse().getContentAsString();
        
        String requestId = objectMapper.readTree(reqResponse).get("id").asText();

        // 2. Fulfill Request
        FulfillRequestDTO fulfillReq = new FulfillRequestDTO("AWS Secret", "secretVal", Map.of("env", "prod"));
        
        mockMvc.perform(post("/api/v1/requests/" + requestId + "/fulfill")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fulfillReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("fulfilled"))
                .andExpect(jsonPath("$.mappedSecretId").exists());
        
        // Verify secret was created
        // We can't verify secret content easily without getting it, but mappedSecretId proves link.
    }

    @Test
    void rejectRequest_Success() throws Exception {
        UUID tenantId = createTenant();
        userService.createAdminUser(tenantId, "admin", "password");
        String token = getAuthToken(tenantId, "admin", "password");

        CreateRequestDTO createReq = new CreateRequestDTO("Bad Req", "Context", null, null);
        String reqResponse = mockMvc.perform(post("/api/v1/requests")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andReturn().getResponse().getContentAsString();
        String requestId = objectMapper.readTree(reqResponse).get("id").asText();

        RejectRequestDTO rejectReq = new RejectRequestDTO("Denied");
        
        mockMvc.perform(post("/api/v1/requests/" + requestId + "/reject")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("rejected"))
                .andExpect(jsonPath("$.rejectionReason").value("Denied"));
    }
}
