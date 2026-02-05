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
package com.agentvault.security;

import static org.junit.jupiter.api.Assertions.*;

import com.agentvault.model.Role;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

class HttpRequestTenantProviderTest {

  private final HttpRequestTenantProvider tenantProvider = new HttpRequestTenantProvider();

  @BeforeEach
  void setup() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void getTenantContext_Authenticated_ReturnsContext() {
    UUID tenantId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    Jwt jwt =
        new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "HS256"),
            Map.of("sub", userId.toString(), "tenant_id", tenantId.toString()));

    AgentVaultAuthentication auth =
        new AgentVaultAuthentication(
            jwt, tenantId, userId, Role.ADMIN, null, Collections.emptyList());

    SecurityContextHolder.getContext().setAuthentication(auth);

    TenantContext context = tenantProvider.getTenantContext();
    assertNotNull(context);
    assertEquals(tenantId, context.tenantId());
  }

  @Test
  void getTenantContext_Unauthenticated_ThrowsException() {
    assertThrows(IllegalStateException.class, tenantProvider::getTenantContext);
  }
}
