package com.agentvault.controller;

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.RequestService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
public class RequestController {

  private final RequestService requestService;

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public RequestResponse createRequest(
      AgentVaultAuthentication authentication, @RequestBody CreateRequestDTO dto) {
    // Typically agents create requests
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
      @RequestBody FulfillRequestDTO dto) {
    // Typically admins
    return requestService.fulfillRequest(authentication.getTenantId(), id, dto);
  }

  @PostMapping("/{id}/map")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse mapRequest(
      AgentVaultAuthentication authentication,
      @PathVariable String id,
      @RequestBody MapRequestDTO dto) {
    return requestService.mapRequest(authentication.getTenantId(), id, dto.secretId());
  }

  @PostMapping("/{id}/reject")
  @PreAuthorize("hasRole('ADMIN')")
  public RequestResponse rejectRequest(
      AgentVaultAuthentication authentication,
      @PathVariable String id,
      @RequestBody RejectRequestDTO dto) {
    return requestService.rejectRequest(authentication.getTenantId(), id, dto.reason());
  }
}
