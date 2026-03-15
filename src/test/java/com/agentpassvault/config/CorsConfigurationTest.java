/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agentpassvault.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class CorsConfigurationTest extends BaseIntegrationTest {

  @Test
  void preflightRequest_WithAllowedUiOrigin_ReturnsCorsHeaders() throws Exception {
    mockMvc
        .perform(
            options("/api/v1/auth/login/user")
                .header(HttpHeaders.ORIGIN, "https://vault.local")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://vault.local"))
        .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
  }

  @Test
  void preflightRequest_WithDisallowedOrigin_IsRejected() throws Exception {
    mockMvc
        .perform(
            options("/api/v1/auth/login/user")
                .header(HttpHeaders.ORIGIN, "https://evil.example.com")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type"))
        .andExpect(status().isForbidden());
  }
}
