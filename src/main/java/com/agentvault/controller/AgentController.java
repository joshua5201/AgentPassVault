package com.agentvault.controller;

import com.agentvault.dto.AgentResponse;
import com.agentvault.dto.AgentTokenResponse;
import com.agentvault.dto.CreateAgentRequest;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    public List<AgentResponse> listAgents(AgentVaultAuthentication authentication) {
        return agentService.listAgents(authentication.getTenantId());
    }

    @PostMapping
    public AgentTokenResponse createAgent(
            AgentVaultAuthentication authentication,
            @RequestBody CreateAgentRequest request) {
        return agentService.createAgent(authentication.getTenantId(), request.name());
    }

    @PostMapping("/{id}/rotate")
    public AgentTokenResponse rotateToken(
            AgentVaultAuthentication authentication,
            @PathVariable UUID id) {
        return agentService.rotateToken(authentication.getTenantId(), id);
    }

    @DeleteMapping("/{id}")
    public void deleteAgent(
            AgentVaultAuthentication authentication,
            @PathVariable UUID id) {
        agentService.deleteAgent(authentication.getTenantId(), id);
    }
}
