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

import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SearchSecretRequest;
import com.agentvault.dto.SecretMetadataResponse;
import com.agentvault.dto.SecretResponse;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.SecretService;
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

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public SecretMetadataResponse createSecret(
      AgentVaultAuthentication authentication, @Valid @RequestBody CreateSecretRequest request) {
    return secretService.createSecret(authentication.getTenantId(), request);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public SecretResponse getSecret(
      AgentVaultAuthentication authentication,
      @PathVariable Long id,
      @RequestParam(required = false) String leaseToken) {
    if (leaseToken != null) {
      return secretService.getSecretWithLease(authentication.getTenantId(), id, leaseToken);
    }
    return secretService.getSecret(authentication, id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void deleteSecret(AgentVaultAuthentication authentication, @PathVariable Long id) {
    secretService.deleteSecret(authentication.getTenantId(), id);
  }

  @PostMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public List<SecretMetadataResponse> searchSecrets(
      AgentVaultAuthentication authentication, @RequestBody SearchSecretRequest request) {
    return secretService.searchSecrets(authentication.getTenantId(), request.metadata());
  }
}
