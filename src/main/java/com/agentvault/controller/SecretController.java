package com.agentvault.controller;

import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SearchSecretRequest;
import com.agentvault.dto.SecretMetadataResponse;
import com.agentvault.dto.SecretResponse;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.SecretService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/secrets")
@RequiredArgsConstructor
public class SecretController {

    private final SecretService secretService;

    @PostMapping
    public SecretMetadataResponse createSecret(
            AgentVaultAuthentication authentication,
            @RequestBody CreateSecretRequest request) {
        return secretService.createSecret(authentication.getTenantId(), request);
    }

    @GetMapping("/{id}")
    public SecretResponse getSecret(
            AgentVaultAuthentication authentication,
            @PathVariable String id) {
        return secretService.getSecret(authentication.getTenantId(), id);
    }

    @DeleteMapping("/{id}")
    public void deleteSecret(
            AgentVaultAuthentication authentication,
            @PathVariable String id) {
        secretService.deleteSecret(authentication.getTenantId(), id);
    }

    @PostMapping("/search")
    public List<SecretMetadataResponse> searchSecrets(
            AgentVaultAuthentication authentication,
            @RequestBody SearchSecretRequest request) {
        return secretService.searchSecrets(authentication.getTenantId(), request.metadata());
    }
}
