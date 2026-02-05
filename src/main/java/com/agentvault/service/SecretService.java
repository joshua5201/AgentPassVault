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
package com.agentvault.service;

import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SecretMetadataResponse;
import com.agentvault.dto.SecretResponse;
import com.agentvault.model.Secret;
import com.agentvault.model.SecretVisibility;
import com.agentvault.model.Tenant;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.service.crypto.EncryptionService;
import com.agentvault.service.crypto.KeyManagementService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SecretService {

  private final SecretRepository secretRepository;
  private final TenantRepository tenantRepository;
  private final KeyManagementService keyManagementService;
  private final EncryptionService encryptionService;
  private final MongoTemplate mongoTemplate; // For dynamic search queries
  private final TokenService tokenService;

  public SecretMetadataResponse createSecret(UUID tenantId, CreateSecretRequest request) {
    byte[] tenantKey = getTenantKey(tenantId);

    byte[] encryptedValue =
        encryptionService.encrypt(request.value().getBytes(StandardCharsets.UTF_8), tenantKey);

    Secret secret = new Secret();
    secret.setSecretId(UUID.randomUUID());
    secret.setTenantId(tenantId);
    secret.setName(request.name());
    secret.setEncryptedValue(encryptedValue);
    secret.setMetadata(request.metadata());

    Secret saved = secretRepository.save(secret);

    return mapToMetadataResponse(saved);
  }

  public SecretResponse getSecret(UUID tenantId, UUID secretId) {
    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    if (secret.getVisibility() == SecretVisibility.LEASE_REQUIRED) {
      throw new IllegalStateException("Secret requires a lease token for access");
    }
    if (secret.getVisibility() == SecretVisibility.HIDDEN) {
      throw new IllegalStateException("Secret is hidden");
    }

    byte[] tenantKey = getTenantKey(tenantId);
    byte[] decryptedBytes = encryptionService.decrypt(secret.getEncryptedValue(), tenantKey);
    String decryptedValue = new String(decryptedBytes, StandardCharsets.UTF_8);

    return mapToResponse(secret, decryptedValue);
  }

  public SecretResponse getSecretWithLease(UUID tenantId, UUID secretId, String leaseToken) {
    tokenService.validateLeaseToken(leaseToken, secretId.toString());

    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    byte[] tenantKey = getTenantKey(tenantId);
    byte[] decryptedBytes = encryptionService.decrypt(secret.getEncryptedValue(), tenantKey);
    String decryptedValue = new String(decryptedBytes, StandardCharsets.UTF_8);

    return mapToResponse(secret, decryptedValue);
  }

  public void deleteSecret(UUID tenantId, UUID secretId) {
    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    secretRepository.delete(secret);
  }

  public List<SecretMetadataResponse> searchSecrets(
      UUID tenantId, Map<String, Object> metadataQuery) {
    Query query = new Query();
    query.addCriteria(Criteria.where("tenantId").is(tenantId));
    // Exclude hidden secrets from agent searches
    query.addCriteria(Criteria.where("visibility").ne(SecretVisibility.HIDDEN));

    if (metadataQuery != null) {
      metadataQuery.forEach(
          (key, value) -> {
            // Assuming exact match for metadata values
            query.addCriteria(Criteria.where("metadata." + key).is(value));
          });
    }

    List<Secret> secrets = mongoTemplate.find(query, Secret.class);

    return secrets.stream().map(this::mapToMetadataResponse).collect(Collectors.toList());
  }

  private byte[] getTenantKey(UUID tenantId) {
    Tenant tenant =
        tenantRepository
            .findByTenantId(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
    return keyManagementService.decryptTenantKey(tenant.getEncryptedTenantKey());
  }

  private SecretResponse mapToResponse(Secret secret, String decryptedValue) {
    return new SecretResponse(
        secret.getSecretId(),
        secret.getName(),
        decryptedValue,
        secret.getMetadata(),
        secret.getVisibility(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }

  private SecretMetadataResponse mapToMetadataResponse(Secret secret) {
    return new SecretMetadataResponse(
        secret.getSecretId(),
        secret.getName(),
        secret.getMetadata(),
        secret.getVisibility(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }
}
