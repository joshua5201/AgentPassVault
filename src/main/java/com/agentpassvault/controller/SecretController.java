/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.controller;

import com.agentpassvault.dto.*;
import com.agentpassvault.security.AgentPassVaultAuthentication;
import com.agentpassvault.service.SecretService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/secrets")
@RequiredArgsConstructor
@Validated
public class SecretController {

  private final SecretService secretService;

  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public List<SecretDetailsResponse> listSecrets(AgentPassVaultAuthentication authentication) {
    return secretService.listAllSecretsForPrincipal(authentication);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public SecretMetadataResponse createSecret(
      AgentPassVaultAuthentication authentication,
      @Valid @RequestBody CreateSecretRequest request) {
    return secretService.createSecret(authentication.getTenantId(), request);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public SecretResponse getSecret(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long id,
      @RequestParam(required = false) String leaseToken) {
    if (leaseToken != null) {
      return secretService.getSecretWithLease(authentication.getTenantId(), id, leaseToken);
    }
    return secretService.getSecret(authentication, id);
  }

  @PatchMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public SecretMetadataResponse updateSecret(
      AgentPassVaultAuthentication authentication,
      @PathVariable Long id,
      @Valid @RequestBody UpdateSecretRequest request) {
    return secretService.updateSecret(authentication.getTenantId(), id, request);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void deleteSecret(AgentPassVaultAuthentication authentication, @PathVariable Long id) {
    secretService.deleteSecret(authentication.getTenantId(), id);
  }

  @PostMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public List<SecretMetadataResponse> searchSecrets(
      AgentPassVaultAuthentication authentication, @RequestBody SearchSecretRequest request) {
    return secretService.searchSecrets(authentication.getTenantId(), request);
  }
}
