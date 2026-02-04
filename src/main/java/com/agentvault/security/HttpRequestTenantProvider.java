/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.security;

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

    if (authentication instanceof AgentVaultAuthentication agentAuth) {
      return new TenantContext(agentAuth.getTenantId());
    }

    throw new IllegalStateException("No valid AgentVaultAuthentication found in SecurityContext.");
  }
}
