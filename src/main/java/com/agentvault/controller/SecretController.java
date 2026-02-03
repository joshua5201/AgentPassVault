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
      AgentVaultAuthentication authentication, @PathVariable String id) {
    return secretService.getSecret(authentication.getTenantId(), id);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public void deleteSecret(AgentVaultAuthentication authentication, @PathVariable String id) {
    secretService.deleteSecret(authentication.getTenantId(), id);
  }

  @PostMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN', 'AGENT')")
  public List<SecretMetadataResponse> searchSecrets(
      AgentVaultAuthentication authentication, @RequestBody SearchSecretRequest request) {
    return secretService.searchSecrets(authentication.getTenantId(), request.metadata());
  }
}
