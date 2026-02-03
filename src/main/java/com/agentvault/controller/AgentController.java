package com.agentvault.controller;

import com.agentvault.dto.AgentResponse;
import com.agentvault.dto.AgentTokenResponse;
import com.agentvault.dto.CreateAgentRequest;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AgentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class AgentController {

  private final AgentService agentService;

  @GetMapping
  public List<AgentResponse> listAgents(AgentVaultAuthentication authentication) {
    return agentService.listAgents(authentication.getTenantId());
  }

  @PostMapping
  public AgentTokenResponse createAgent(
      AgentVaultAuthentication authentication, @Valid @RequestBody CreateAgentRequest request) {
    return agentService.createAgent(authentication.getTenantId(), request.name());
  }

  @PostMapping("/{id}/rotate")
  public AgentTokenResponse rotateToken(
      AgentVaultAuthentication authentication, @PathVariable UUID id) {
    return agentService.rotateToken(authentication.getTenantId(), id);
  }

  @DeleteMapping("/{id}")
  public void deleteAgent(AgentVaultAuthentication authentication, @PathVariable UUID id) {
    agentService.deleteAgent(authentication.getTenantId(), id);
  }
}
