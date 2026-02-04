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

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.RequestService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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
        authentication.getTenantId(), (UUID) authentication.getPrincipal(), dto);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public RequestResponse getRequest(
      AgentVaultAuthentication authentication, @PathVariable String id) {
    return requestService.getRequest(authentication.getTenantId(), id);
  }

  @PostMapping("/{id}/fulfill")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse fulfillRequest(
      AgentVaultAuthentication authentication,
      @PathVariable String id,
      @Valid @RequestBody FulfillRequestDTO dto) {
    return requestService.fulfillRequest(authentication.getTenantId(), id, dto);
  }

  @PostMapping("/{id}/map")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse mapRequest(
      AgentVaultAuthentication authentication,
      @PathVariable String id,
      @Valid @RequestBody MapRequestDTO dto) {
    return requestService.mapRequest(authentication.getTenantId(), id, dto.secretId());
  }

  @PostMapping("/{id}/reject")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse rejectRequest(
      AgentVaultAuthentication authentication,
      @PathVariable String id,
      @Valid @RequestBody RejectRequestDTO dto) {
    return requestService.rejectRequest(authentication.getTenantId(), id, dto.reason());
  }
}
