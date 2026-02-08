/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.agentpassvault.BaseIntegrationTest;
import com.agentpassvault.dto.RegistrationRequest;
import com.agentpassvault.dto.UserLoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class RegistrationControllerTest extends BaseIntegrationTest {



  @Test

  void register_NewTenantAndUser_Success() throws Exception {

    RegistrationRequest request = new RegistrationRequest(

        "admin@example.com",

        "securePassword123",

        "Admin User"

    );



    mockMvc

        .perform(

            post("/api/v1/auth/register")

                .contentType(MediaType.APPLICATION_JSON)

                .content(objectMapper.writeValueAsString(request)))

        .andExpect(status().isOk())

        .andExpect(jsonPath("$.tenantId").exists())

        .andExpect(jsonPath("$.userId").exists());



    // Verify the user can login

    UserLoginRequest loginReq = new UserLoginRequest("admin@example.com", "securePassword123");

    mockMvc

        .perform(

            post("/api/v1/auth/login/user")

                .contentType(MediaType.APPLICATION_JSON)

                .content(objectMapper.writeValueAsString(loginReq)))

        .andExpect(status().isOk())

        .andExpect(jsonPath("$.accessToken").exists());

  }



  @Test

  void register_MultipleUsersSameDefaultTenantName_Success() throws Exception {

    RegistrationRequest request1 = new RegistrationRequest(

        "user1@example.com",

        "password",

        "User One"

    );



    mockMvc

        .perform(

            post("/api/v1/auth/register")

                .contentType(MediaType.APPLICATION_JSON)

                .content(objectMapper.writeValueAsString(request1)))

        .andExpect(status().isOk());



    RegistrationRequest request2 = new RegistrationRequest(

        "user2@example.com",

        "password",

        "User Two"

    );



    mockMvc

        .perform(

            post("/api/v1/auth/register")

                .contentType(MediaType.APPLICATION_JSON)

                .content(objectMapper.writeValueAsString(request2)))

        .andExpect(status().isOk());

  }

}


