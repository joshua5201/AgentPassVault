package com.agentvault.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class JwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID tenantId = UUID.fromString(jwt.getClaimAsString("tenant_id"));
        UUID userId = UUID.fromString(jwt.getSubject());
        String role = jwt.getClaimAsString("role");
        
        String agentIdStr = jwt.getClaimAsString("agent_id");
        UUID agentId = (agentIdStr != null) ? UUID.fromString(agentIdStr) : null;

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())
        );

        return new AgentVaultAuthentication(jwt, tenantId, userId, role, agentId, authorities);
    }
}
