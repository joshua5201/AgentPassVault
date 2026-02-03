package com.agentvault.security;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

/**
 * Request-scoped bean that provides the TenantContext for the current request.
 * It extracts the tenant information from the authenticated Principal.
 */
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class HttpRequestTenantProvider {

    public TenantContext getTenantContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof AgentVaultAuthentication agentAuth) {
            return new TenantContext(agentAuth.getTenantId());
        }

        throw new IllegalStateException("No valid AgentVaultAuthentication found in SecurityContext.");
    }
}
