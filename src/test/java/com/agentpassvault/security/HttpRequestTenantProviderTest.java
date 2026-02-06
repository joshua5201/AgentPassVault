/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import static org.junit.jupiter.api.Assertions.*;

import com.agentpassvault.model.Role;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
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
    Long tenantId = 123L;
    Long userId = 456L;

    Jwt jwt =
        new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "HS256"),
            Map.of("sub", userId.toString(), "tenant_id", tenantId.toString()));

    AgentPassVaultAuthentication auth =
        new AgentPassVaultAuthentication(
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
