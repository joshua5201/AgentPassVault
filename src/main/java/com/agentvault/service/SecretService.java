package com.agentvault.service;

import com.agentvault.dto.CreateSecretRequest;
import com.agentvault.dto.SecretResponse;
import com.agentvault.model.Secret;
import com.agentvault.model.Tenant;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.service.crypto.EncryptionService;
import com.agentvault.service.crypto.KeyManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecretService {

    private final SecretRepository secretRepository;
    private final TenantRepository tenantRepository;
    private final KeyManagementService keyManagementService;
    private final EncryptionService encryptionService;
    private final MongoTemplate mongoTemplate; // For dynamic search queries

    public SecretResponse createSecret(UUID tenantId, CreateSecretRequest request) {
        byte[] tenantKey = getTenantKey(tenantId);
        
        byte[] encryptedValue = encryptionService.encrypt(
            request.value().getBytes(StandardCharsets.UTF_8), 
            tenantKey
        );

        Secret secret = new Secret();
        secret.setTenantId(tenantId);
        secret.setName(request.name());
        secret.setEncryptedValue(encryptedValue);
        secret.setMetadata(request.metadata());
        secret.setCreatedAt(LocalDateTime.now());
        secret.setUpdatedAt(LocalDateTime.now());

        Secret saved = secretRepository.save(secret);
        
        // Return decrypted response (or should create return the ID only? API usually returns resource)
        // For security, maybe just ID? But often users want to see what they created.
        // Let's return the full response for now.
        return mapToResponse(saved, request.value());
    }

    public SecretResponse getSecret(UUID tenantId, String secretId) {
        Secret secret = secretRepository.findById(secretId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

        byte[] tenantKey = getTenantKey(tenantId);
        byte[] decryptedBytes = encryptionService.decrypt(secret.getEncryptedValue(), tenantKey);
        String decryptedValue = new String(decryptedBytes, StandardCharsets.UTF_8);

        return mapToResponse(secret, decryptedValue);
    }

    public void deleteSecret(UUID tenantId, String secretId) {
        Secret secret = secretRepository.findById(secretId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

        secretRepository.delete(secret);
    }

    public List<SecretResponse> searchSecrets(UUID tenantId, Map<String, Object> metadataQuery) {
        Query query = new Query();
        query.addCriteria(Criteria.where("tenantId").is(tenantId));

        if (metadataQuery != null) {
            metadataQuery.forEach((key, value) -> {
                // Assuming exact match for metadata values
                query.addCriteria(Criteria.where("metadata." + key).is(value));
            });
        }

        List<Secret> secrets = mongoTemplate.find(query, Secret.class);
        byte[] tenantKey = getTenantKey(tenantId);

        return secrets.stream().map(s -> {
            // Decrypting ALL secrets in a search result might be heavy and sensitive.
            // Usually list/search endpoints return metadata only, and explicit GET retrieves value.
            // But implementation-plan implies "searchSecrets" finds them.
            // Let's decrypt for now, but in prod we might mask the value in list views.
            byte[] decryptedBytes = encryptionService.decrypt(s.getEncryptedValue(), tenantKey);
            String value = new String(decryptedBytes, StandardCharsets.UTF_8);
            return mapToResponse(s, value);
        }).collect(Collectors.toList());
    }

    private byte[] getTenantKey(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
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
            secret.getUpdatedAt()
        );
    }
}
