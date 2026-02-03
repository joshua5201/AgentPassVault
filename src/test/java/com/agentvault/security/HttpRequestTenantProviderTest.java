package com.agentvault.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

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
        
        Jwt jwt = new Jwt("token", Instant.now(), Instant.now().plusSeconds(60),
                Map.of("alg", "HS256"),
                Map.of("sub", userId.toString(), "tenant_id", tenantId.toString()));

        AgentVaultAuthentication auth = new AgentVaultAuthentication(
                jwt, tenantId, userId, "admin", null, Collections.emptyList());
        
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
