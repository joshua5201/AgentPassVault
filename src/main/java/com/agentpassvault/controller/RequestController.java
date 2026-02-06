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
