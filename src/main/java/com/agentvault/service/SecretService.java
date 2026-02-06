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

import com.agentvault.dto.CreateLeaseRequest;
import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SecretMetadataResponse;
import com.agentvault.dto.SecretResponse;
import com.agentvault.model.*;
import com.agentvault.repository.LeaseRepository;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import com.agentvault.security.AgentVaultAuthentication;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecretService {

  private static final int MAX_METADATA_SIZE_BYTES = 8192; // 8 KB

  private final SecretRepository secretRepository;
  private final TenantRepository tenantRepository;
  private final LeaseRepository leaseRepository;
  private final UserRepository userRepository;
  private final EntityManager entityManager;
  private final TokenService tokenService;
  private final ObjectMapper objectMapper;

  @Transactional
  public SecretMetadataResponse createSecret(Long tenantId, CreateSecretRequest request) {
    Tenant tenant =
        tenantRepository
            .findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

    validateMetadataSize(request.metadata());

    Secret secret = new Secret();
    secret.setTenant(tenant);
    secret.setName(request.name());
    secret.setEncryptedData(request.encryptedValue());
    secret.setMetadata(request.metadata());

    Secret saved = secretRepository.save(secret);

    return mapToMetadataResponse(saved);
  }

  @Transactional
  public void createLease(Long tenantId, Long secretId, CreateLeaseRequest request) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    User agent =
        userRepository
            .findById(Long.valueOf(request.agentId()))
            .filter(u -> u.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

    Lease lease =
        leaseRepository.findBySecret_IdAndAgent_Id(secretId, agent.getId()).orElse(new Lease());

    if (lease.getId() == null) {
      lease.setSecret(secret);
      lease.setAgent(agent);
    }

    lease.setEncryptedData(request.encryptedData());
    lease.setExpiry(request.expiry());

    leaseRepository.save(lease);
  }

  public SecretResponse getSecret(AgentVaultAuthentication auth, Long secretId) {
    Long tenantId = auth.getTenantId();
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    if (Role.ADMIN.equals(auth.getRole())) {
      return mapToResponse(secret, secret.getEncryptedData());
    }

    // Agent access
    // Find lease for this agent
    return leaseRepository
        .findBySecret_IdAndAgent_Id(secretId, (Long) auth.getPrincipal())
        .map(lease -> mapToResponse(secret, lease.getEncryptedData()))
        .orElseThrow(() -> new AccessDeniedException("No valid lease found for this secret"));
  }

  // Deprecated flow but keeping for now if tests use it
  public SecretResponse getSecretWithLease(Long tenantId, Long secretId, String leaseToken) {
    tokenService.validateLeaseToken(leaseToken, secretId.toString());

    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    return mapToResponse(
        secret, secret.getEncryptedData()); // This is wrong in ZK but keeping for compilation
  }

  @Transactional
  public void deleteSecret(Long tenantId, Long secretId) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    secretRepository.delete(secret);
  }

  @SuppressWarnings("unchecked")
  public List<SecretMetadataResponse> searchSecrets(
      Long tenantId, Map<String, Object> metadataQuery) {
    StringBuilder sql = new StringBuilder("SELECT s.* FROM secrets s ");
    sql.append("JOIN tenants t ON s.tenant_id = t.id ");
    sql.append("WHERE t.id = :tenantId ");

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

  private void validateMetadataSize(Map<String, Object> metadata) {
    if (metadata == null || metadata.isEmpty()) {
      return;
    }
    try {
      String json = objectMapper.writeValueAsString(metadata);
      if (json.getBytes(StandardCharsets.UTF_8).length > MAX_METADATA_SIZE_BYTES) {
        throw new IllegalArgumentException("Metadata size exceeds limit of 8 KB");
      }
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid metadata format", e);
    }
  }

  private SecretResponse mapToResponse(Secret secret, String encryptedData) {
    return new SecretResponse(
        secret.getId().toString(),
        secret.getName(),
        encryptedData,
        secret.getMetadata(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }

  private SecretMetadataResponse mapToMetadataResponse(Secret secret) {
    return new SecretMetadataResponse(
        secret.getId().toString(),
        secret.getName(),
        secret.getMetadata(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }
}
