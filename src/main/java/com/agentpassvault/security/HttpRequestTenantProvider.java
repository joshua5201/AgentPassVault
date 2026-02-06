/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

/**
 * Request-scoped bean that provides the TenantContext for the current request. It extracts the
 * tenant information from the authenticated Principal.
 */
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class HttpRequestTenantProvider {

  public TenantContext getTenantContext() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication instanceof AgentPassVaultAuthentication agentAuth) {
      return new TenantContext(agentAuth.getTenantId());
    }

    throw new IllegalStateException(
        "No valid AgentPassVaultAuthentication found in SecurityContext.");
  }
}
