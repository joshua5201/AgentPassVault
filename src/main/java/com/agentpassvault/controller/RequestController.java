/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import com.agentpassvault.dto.*;
import com.agentpassvault.security.AgentPassVaultAuthentication;
import com.agentpassvault.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@Validated
public class RequestController {

  private final RequestService requestService;

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public RequestResponse createRequest(
      AgentPassVaultAuthentication authentication, @Valid @RequestBody CreateRequestDTO dto) {
    return requestService.createRequest(
        authentication.getTenantId(), (Long) authentication.getPrincipal(), dto);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public RequestResponse getRequest(
      AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    return requestService.getRequest(authentication.getTenantId(), id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('AGENT')")
  public ResponseEntity<Void> abandonRequest(
      AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    requestService.abandonRequest(
        authentication.getTenantId(), (Long) authentication.getPrincipal(), id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse updateRequest(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long id,
      @Valid @RequestBody UpdateRequestDTO dto) {
    return requestService.updateRequestStatus(authentication.getTenantId(), id, dto);
  }
}
