/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agentvault.BaseIntegrationTest;
import com.agentvault.dto.CreateRequestDTO;
import com.agentvault.dto.LoginRequest;
import com.agentvault.dto.UpdateRequestDTO;
import com.agentvault.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class RequestControllerTest extends BaseIntegrationTest {

  @Autowired private UserService userService;

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
            .andReturn()
            .getResponse()
            .getContentAsString();
    String requestId = objectMapper.readTree(reqResponse).get("id").asText();

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
    String requestId = objectMapper.readTree(reqResponse).get("id").asText();

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
}
