/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import com.agentpassvault.dto.AgentResponse;
import com.agentpassvault.dto.AgentTokenResponse;
import com.agentpassvault.dto.CreateAgentRequest;
import com.agentpassvault.dto.RegisterAgentRequest;
import com.agentpassvault.model.Role;
import com.agentpassvault.security.AgentPassVaultAuthentication;
import com.agentpassvault.service.AgentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@Validated
public class AgentController {

  private final AgentService agentService;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<AgentResponse> listAgents(AgentPassVaultAuthentication authentication) {
    return agentService.listAgents(authentication.getTenantId());
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public AgentResponse getAgent(
      AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    // Re-use listAgents filtering logic via mapToResponse helper in service
    // or better, add getAgent to service. I'll add it to service.
    return agentService.getAgentResponse(authentication.getTenantId(), id);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public AgentTokenResponse createAgent(
      AgentPassVaultAuthentication authentication, @Valid @RequestBody CreateAgentRequest request) {
    return agentService.createAgent(authentication.getTenantId(), request.name());
  }

  @PostMapping("/{id}/rotate")
  @PreAuthorize("hasRole('ADMIN')")
  public AgentTokenResponse rotateToken(
      AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    return agentService.rotateToken(authentication.getTenantId(), id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void deleteAgent(AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    agentService.deleteAgent(authentication.getTenantId(), id);
  }

  @PostMapping("/{id}/register")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public void registerAgent(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long id,
      @Valid @RequestBody RegisterAgentRequest request) {

    // Security check: if role is AGENT, they can only register for themselves
    if (Role.AGENT.equals(authentication.getRole()) && !id.equals(authentication.getPrincipal())) {
      throw new AccessDeniedException("Agents can only register their own public key");
    }

    agentService.registerPublicKey(authentication.getTenantId(), id, request.publicKey());
  }
}
