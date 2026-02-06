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

import com.agentpassvault.dto.CreateLeaseRequest;
import com.agentpassvault.dto.LeaseResponse;
import com.agentpassvault.security.AgentPassVaultAuthentication;
import com.agentpassvault.service.SecretService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/secrets/{secretId}/leases")
@RequiredArgsConstructor
@Validated
public class LeaseController {

  private final SecretService secretService;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<LeaseResponse> listLeases(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long secretId,
      @RequestParam(required = false) Long agentId) {
    return secretService.listLeases(authentication.getTenantId(), secretId, agentId);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public void createLease(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long secretId,
      @Valid @RequestBody CreateLeaseRequest request) {
    secretService.createLease(authentication.getTenantId(), secretId, request);
  }

  @DeleteMapping("/{agentId}")
  @PreAuthorize("hasRole('ADMIN')")
  public void revokeLease(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long secretId,
      @PathVariable Long agentId) {
    secretService.deleteLease(authentication.getTenantId(), secretId, agentId);
  }
}
