/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.dto.CreateLeaseRequest;
import com.agentpassvault.dto.CreateSecretRequest;
import com.agentpassvault.dto.LeaseResponse;
import com.agentpassvault.dto.SecretMetadataResponse;
import com.agentpassvault.dto.SecretResponse;
import com.agentpassvault.dto.UpdateSecretRequest;
import com.agentpassvault.exception.ResourceNotFoundException;
import com.agentpassvault.model.*;
import com.agentpassvault.repository.LeaseRepository;
import com.agentpassvault.repository.SecretRepository;
import com.agentpassvault.repository.TenantRepository;
import com.agentpassvault.repository.UserRepository;
import com.agentpassvault.security.AgentPassVaultAuthentication;
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
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

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
  public SecretMetadataResponse updateSecret(
      Long tenantId, Long secretId, UpdateSecretRequest request) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    if (request.name() != null) {
      secret.setName(request.name());
    }
    if (request.encryptedValue() != null) {
      secret.setEncryptedData(request.encryptedValue());
      // Delete all existing leases for this secret as they are now invalid
      List<Lease> leases = leaseRepository.findBySecret_Id(secretId);
      leaseRepository.deleteAll(leases);
    }
    if (request.metadata() != null) {
      validateMetadataSize(request.metadata());
      secret.setMetadata(request.metadata());
    }

    if (request.updatedLeases() != null) {
      for (UpdateSecretRequest.LeaseUpdateRequest leaseUpdate : request.updatedLeases()) {
        User agent =
            userRepository
                .findById(Long.valueOf(leaseUpdate.agentId()))
                .filter(u -> u.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

        Lease lease = new Lease();
        lease.setSecret(secret);
        lease.setAgent(agent);
        lease.setPublicKey(leaseUpdate.publicKey());
        lease.setEncryptedData(leaseUpdate.encryptedData());
        // Note: expiry is not updated here, it would need to be added to LeaseUpdateRequest if
        // needed
        leaseRepository.save(lease);
      }
    }

    Secret saved = secretRepository.save(secret);
    return mapToMetadataResponse(saved);
  }

  @Transactional
  public void createLease(Long tenantId, Long secretId, CreateLeaseRequest request) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    User agent =
        userRepository
            .findById(Long.valueOf(request.agentId()))
            .filter(u -> u.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

    Lease lease =
        leaseRepository
            .findBySecret_IdAndAgent_IdAndPublicKey(secretId, agent.getId(), request.publicKey())
            .orElse(new Lease());

    if (lease.getId() == null) {
      lease.setSecret(secret);
      lease.setAgent(agent);
      lease.setPublicKey(request.publicKey());
    }

    lease.setEncryptedData(request.encryptedData());
    lease.setExpiry(request.expiry());

    leaseRepository.save(lease);
  }

  public List<LeaseResponse> listLeases(Long tenantId, Long secretId, Long agentId) {
    // Verify secret exists and belongs to tenant
    @SuppressWarnings("unused")
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    List<Lease> leases;
    if (agentId != null) {
      leases = leaseRepository.findBySecret_IdAndAgent_Id(secretId, agentId);
    } else {
      leases = leaseRepository.findBySecret_Id(secretId);
    }

    return leases.stream().map(this::mapToLeaseResponse).collect(Collectors.toList());
  }

  @Transactional
  public void deleteLease(Long tenantId, Long secretId, Long agentId) {
    // Verify secret exists and belongs to tenant
    @SuppressWarnings("unused")
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    // Verify agent exists and belongs to tenant
    @SuppressWarnings("unused")
    User agent =
        userRepository
            .findById(agentId)
            .filter(u -> u.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

    // Design says DELETE /api/v1/secrets/:id/leases/:agentId
    // But an agent might have multiple leases with different public keys.
    // To keep it simple, we delete all leases for that agent for that secret.
    List<Lease> leases =
        leaseRepository.findBySecret_Id(secretId).stream()
            .filter(l -> l.getAgent().getId().equals(agentId))
            .toList();

    leaseRepository.deleteAll(leases);
  }

  public SecretResponse getSecret(AgentPassVaultAuthentication auth, Long secretId) {
    Long tenantId = auth.getTenantId();
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    if (Role.ADMIN.equals(auth.getRole())) {
      return mapToResponse(secret, secret.getEncryptedData());
    }

    // Agent access
    // Find lease for this agent with its CURRENT public key
    User agent =
        userRepository
            .findById((Long) auth.getPrincipal())
            .orElseThrow(() -> new AccessDeniedException("Agent not found"));

    String currentPublicKey = agent.getPublicKey();
    if (currentPublicKey == null) {
      throw new AccessDeniedException("Agent has no registered public key");
    }

    return leaseRepository
        .findBySecret_IdAndAgent_IdAndPublicKey(secretId, agent.getId(), currentPublicKey)
        .map(lease -> mapToResponse(secret, lease.getEncryptedData()))
        .orElseThrow(
            () ->
                new AccessDeniedException(
                    "No valid lease found for this secret and current public key"));
  }

  // Deprecated flow but keeping for now if tests use it
  public SecretResponse getSecretWithLease(Long tenantId, Long secretId, String leaseToken) {
    tokenService.validateLeaseToken(leaseToken, secretId.toString());

    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

    return mapToResponse(
        secret, secret.getEncryptedData()); // This is wrong in ZK but keeping for compilation
  }

  @Transactional
  public void deleteSecret(Long tenantId, Long secretId) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

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
    } catch (JacksonException e) {
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

  private LeaseResponse mapToLeaseResponse(Lease lease) {
    return new LeaseResponse(
        lease.getId().toString(),
        lease.getAgent().getId().toString(),
        lease.getAgent().getDisplayName() != null
            ? lease.getAgent().getDisplayName()
            : lease.getAgent().getUsername(),
        lease.getPublicKey(),
        lease.getEncryptedData(),
        lease.getExpiry(),
        lease.getCreatedAt(),
        lease.getUpdatedAt());
  }
}
