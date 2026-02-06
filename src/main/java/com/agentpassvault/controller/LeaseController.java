/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
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
