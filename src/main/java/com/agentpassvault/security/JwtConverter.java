/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.security;

import com.agentpassvault.model.Role;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class JwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Long tenantId = Long.valueOf(jwt.getClaimAsString("tenant_id"));
    Long userId = Long.valueOf(jwt.getSubject());
    Role role = Role.fromString(jwt.getClaimAsString("role"));

    String agentIdStr = jwt.getClaimAsString("agent_id");
    Long agentId = (agentIdStr != null) ? Long.valueOf(agentIdStr) : null;

    List<GrantedAuthority> authorities =
        Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + role.getValue().toUpperCase(Locale.ROOT)));

    return new AgentPassVaultAuthentication(jwt, tenantId, userId, role, agentId, authorities);
  }
}
