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
package com.agentvault.controller;

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.RequestService;
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
      AgentVaultAuthentication authentication, @Valid @RequestBody CreateRequestDTO dto) {
    return requestService.createRequest(
        authentication.getTenantId(), (Long) authentication.getPrincipal(), dto);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public RequestResponse getRequest(
      AgentVaultAuthentication authentication, @PathVariable Long id) {
    return requestService.getRequest(authentication.getTenantId(), id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('AGENT')")
  public ResponseEntity<Void> abandonRequest(
      AgentVaultAuthentication authentication, @PathVariable Long id) {
    requestService.abandonRequest(
        authentication.getTenantId(), (Long) authentication.getPrincipal(), id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> updateRequest(
      AgentVaultAuthentication authentication,
      @PathVariable Long id,
      @Valid @RequestBody UpdateRequestDTO dto) {
    switch (dto.action()) {
      case FULFILL:
        if (dto.name() == null || dto.ownerEncryptedData() == null || dto.agentEncryptedData() == null) {
          return ResponseEntity.badRequest().body("Name, ownerEncryptedData and agentEncryptedData are required for FULFILL");
        }
        return ResponseEntity.ok(
            requestService.fulfillRequest(
                authentication.getTenantId(),
                id,
                new FulfillRequestDTO(
                    dto.name(),
                    dto.ownerEncryptedData(),
                    dto.agentEncryptedData(),
                    dto.expiry(),
                    dto.metadata())));
      case MAP:
        if (dto.secretId() == null) {
          return ResponseEntity.badRequest().body("Secret ID is required for MAP");
        }
        return ResponseEntity.ok(
            requestService.mapRequest(
                authentication.getTenantId(), id, new MapRequestDTO(dto.secretId())));
      case REJECT:
        if (dto.reason() == null) {
          return ResponseEntity.badRequest().body("Reason is required for REJECT");
        }
        return ResponseEntity.ok(
            requestService.rejectRequest(authentication.getTenantId(), id, dto.reason()));
      case APPROVE_LEASE:
        if (dto.agentEncryptedData() == null) {
          return ResponseEntity.badRequest().body("agentEncryptedData is required for APPROVE_LEASE");
        }
        ApproveLeaseResponseDTO leaseResponse =
            requestService.approveLease(
                authentication.getTenantId(), id, dto.agentEncryptedData(), dto.expiry());
        return ResponseEntity.ok(leaseResponse);
    }
    return ResponseEntity.badRequest().build();
  }
}
