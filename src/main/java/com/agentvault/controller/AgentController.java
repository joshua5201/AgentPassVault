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
