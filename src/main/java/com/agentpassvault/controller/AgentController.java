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
