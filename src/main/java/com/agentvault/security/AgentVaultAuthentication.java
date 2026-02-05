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

import com.agentvault.model.Role;
import java.util.Collection;
import java.util.UUID;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class AgentVaultAuthentication extends AbstractAuthenticationToken {

  private final Jwt jwt;
  private final UUID tenantId;
  private final Role role;
  private final UUID agentId; // Nullable (only for agents)
  private final UUID userId; // Subject

  public AgentVaultAuthentication(
      Jwt jwt,
      UUID tenantId,
      UUID userId,
      Role role,
      UUID agentId,
      Collection<? extends GrantedAuthority> authorities) {
    super(authorities);
    this.jwt = jwt;
    this.tenantId = tenantId;
    this.userId = userId;
    this.role = role;
    this.agentId = agentId;
    setAuthenticated(true);
  }

  @Override
  public Object getCredentials() {
    return jwt;
  }

  @Override
  public Object getPrincipal() {
    return userId;
  }

  public UUID getTenantId() {
    return tenantId;
  }

  public Role getRole() {
    return role;
  }

  public UUID getAgentId() {
    return agentId;
  }

  public Jwt getJwt() {
    return jwt;
  }
}
