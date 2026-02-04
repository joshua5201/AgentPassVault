/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.security;

import com.agentvault.model.Role;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
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
    UUID tenantId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
    UUID userId = UUID.fromString(jwt.getSubject());
    Role role = Role.fromString(jwt.getClaimAsString("role"));

    String agentIdStr = jwt.getClaimAsString("agent_id");
    UUID agentId = (agentIdStr != null) ? UUID.fromString(agentIdStr) : null;

    List<GrantedAuthority> authorities =
        Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + role.getValue().toUpperCase(Locale.ROOT)));

    return new AgentVaultAuthentication(jwt, tenantId, userId, role, agentId, authorities);
  }
}
