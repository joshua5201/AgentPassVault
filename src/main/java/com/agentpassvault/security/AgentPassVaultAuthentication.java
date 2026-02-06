/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import com.agentpassvault.model.Role;
import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class AgentPassVaultAuthentication extends AbstractAuthenticationToken {

  private final Jwt jwt;
  private final Long tenantId;
  private final Role role;
  private final Long agentId; // Nullable (only for agents)
  private final Long userId; // Subject

  public AgentPassVaultAuthentication(
      Jwt jwt,
      Long tenantId,
      Long userId,
      Role role,
      Long agentId,
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

  public Long getTenantId() {
    return tenantId;
  }

  public Role getRole() {
    return role;
  }

  public Long getAgentId() {
    return agentId;
  }

  public Jwt getJwt() {
    return jwt;
  }
}
