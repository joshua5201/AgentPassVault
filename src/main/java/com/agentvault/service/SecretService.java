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
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecretService {

  private final SecretRepository secretRepository;
  private final TenantRepository tenantRepository;
  private final EntityManager entityManager;
  private final TokenService tokenService;

  @Transactional
  public SecretMetadataResponse createSecret(UUID tenantId, CreateSecretRequest request) {
    Tenant tenant =
        tenantRepository
            .findByTenantId(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

    Secret secret = new Secret();
    secret.setSecretId(UUID.randomUUID());
    secret.setTenant(tenant);
    secret.setName(request.name());
    secret.setEncryptedData(request.encryptedValue());
    secret.setMetadata(request.metadata());

    Secret saved = secretRepository.save(secret);

    return mapToMetadataResponse(saved);
  }

  public SecretResponse getSecret(UUID tenantId, UUID secretId) {
    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenant().getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    if (secret.getVisibility() == SecretVisibility.LEASE_REQUIRED) {
      throw new IllegalStateException("Secret requires a lease token for access");
    }
    if (secret.getVisibility() == SecretVisibility.HIDDEN) {
      throw new IllegalStateException("Secret is hidden");
    }

    return mapToResponse(secret);
  }

  public SecretResponse getSecretWithLease(UUID tenantId, UUID secretId, String leaseToken) {
    tokenService.validateLeaseToken(leaseToken, secretId.toString());

    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenant().getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    return mapToResponse(secret);
  }

  @Transactional
  public void deleteSecret(UUID tenantId, UUID secretId) {
    Secret secret =
        secretRepository
            .findBySecretId(secretId)
            .filter(s -> s.getTenant().getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    secretRepository.delete(secret);
  }

  @SuppressWarnings("unchecked")
  public List<SecretMetadataResponse> searchSecrets(
      UUID tenantId, Map<String, Object> metadataQuery) {
    StringBuilder sql = new StringBuilder("SELECT s.* FROM secrets s ");
    sql.append("JOIN tenants t ON s.tenant_id = t.id ");
    sql.append("WHERE t.tenant_id = :tenantId ");
    sql.append("AND s.visibility != 'HIDDEN' ");

    if (metadataQuery != null && !metadataQuery.isEmpty()) {
      metadataQuery.forEach(
          (key, value) -> {
            sql.append("AND JSON_EXTRACT(s.metadata, '$.")
                .append(key)
                .append("') = :")
                .append(key.replace(".", "_"))
                .append(" ");
          });
    }

    Query query = entityManager.createNativeQuery(sql.toString(), Secret.class);
    query.setParameter("tenantId", tenantId.toString().replace("-", "")); // MySQL UUID as binary/string might need handling

    // Actually JPA UUID handling depends on configuration.
    // If using strategy = GenerationType.UUID, it might be stored as binary(16).
    // For native query, it's safer to use the UUID object if the driver supports it.
    query.setParameter("tenantId", tenantId);

    if (metadataQuery != null && !metadataQuery.isEmpty()) {
      metadataQuery.forEach(
          (key, value) -> {
            query.setParameter(key.replace(".", "_"), value.toString());
          });
    }

    List<Secret> secrets = query.getResultList();

    return secrets.stream().map(this::mapToMetadataResponse).collect(Collectors.toList());
  }

  private SecretResponse mapToResponse(Secret secret) {
    return new SecretResponse(
        secret.getSecretId(),
        secret.getName(),
        secret.getEncryptedData(),
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