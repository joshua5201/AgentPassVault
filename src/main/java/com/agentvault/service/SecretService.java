package com.agentvault.service;

import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SecretMetadataResponse;
import com.agentvault.dto.SecretResponse;
import com.agentvault.model.Secret;
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

  public SecretMetadataResponse createSecret(UUID tenantId, CreateSecretRequest request) {
    byte[] tenantKey = getTenantKey(tenantId);

    byte[] encryptedValue =
        encryptionService.encrypt(request.value().getBytes(StandardCharsets.UTF_8), tenantKey);

    Secret secret = new Secret();
    secret.setTenantId(tenantId);
    secret.setName(request.name());
    secret.setEncryptedValue(encryptedValue);
    secret.setMetadata(request.metadata());

    Secret saved = secretRepository.save(secret);

    return mapToMetadataResponse(saved);
  }

  public SecretResponse getSecret(UUID tenantId, String secretId) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    byte[] tenantKey = getTenantKey(tenantId);
    byte[] decryptedBytes = encryptionService.decrypt(secret.getEncryptedValue(), tenantKey);
    String decryptedValue = new String(decryptedBytes, StandardCharsets.UTF_8);

    return mapToResponse(secret, decryptedValue);
  }

  public void deleteSecret(UUID tenantId, String secretId) {
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    secretRepository.delete(secret);
  }

  public List<SecretMetadataResponse> searchSecrets(
      UUID tenantId, Map<String, Object> metadataQuery) {
    Query query = new Query();
    query.addCriteria(Criteria.where("tenantId").is(tenantId));

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
            .findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
    return keyManagementService.decryptTenantKey(tenant.getEncryptedTenantKey());
  }

  private SecretResponse mapToResponse(Secret secret, String decryptedValue) {
    return new SecretResponse(
        secret.getId(),
        secret.getName(),
        decryptedValue,
        secret.getMetadata(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }

  private SecretMetadataResponse mapToMetadataResponse(Secret secret) {
    return new SecretMetadataResponse(
        secret.getId(),
        secret.getName(),
        secret.getMetadata(),
        secret.getCreatedAt(),
        secret.getUpdatedAt());
  }
}
