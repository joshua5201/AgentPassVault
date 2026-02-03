package com.agentvault.service;

import com.agentvault.dto.*;
import com.agentvault.model.Request;
import com.agentvault.model.RequestStatus;
import com.agentvault.repository.RequestRepository;
import com.agentvault.repository.SecretRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestService {

  private final RequestRepository requestRepository;
  private final SecretRepository secretRepository;
  private final SecretService secretService;

  public RequestResponse createRequest(UUID tenantId, UUID requesterId, CreateRequestDTO dto) {
    Request request = new Request();
    request.setTenantId(tenantId);
    request.setRequesterId(requesterId);
    request.setRequestId(UUID.randomUUID());
    request.setStatus(RequestStatus.pending);
    request.setName(dto.name());
    request.setContext(dto.context());
    request.setRequiredMetadata(dto.requiredMetadata());
    request.setRequiredFieldsInSecretValue(dto.requiredFieldsInSecretValue());

    return mapToResponse(requestRepository.save(request));
  }

  public RequestResponse getRequest(UUID tenantId, String id) {
    return mapToResponse(findRequest(tenantId, id));
  }

  @Transactional
  public RequestResponse fulfillRequest(UUID tenantId, String id, FulfillRequestDTO dto) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    // Create the secret
    CreateSecretRequest secretRequest =
        new CreateSecretRequest(dto.name(), dto.value(), dto.metadata());
    SecretMetadataResponse secret = secretService.createSecret(tenantId, secretRequest);

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(secret.id());

    return mapToResponse(requestRepository.save(request));
  }

  public RequestResponse mapRequest(UUID tenantId, String id, String secretId) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    // Verify secret exists and belongs to tenant
    if (secretRepository
        .findById(secretId)
        .filter(s -> s.getTenantId().equals(tenantId))
        .isEmpty()) {
      throw new IllegalArgumentException("Secret not found");
    }

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(secretId);

    return mapToResponse(requestRepository.save(request));
  }

  public RequestResponse rejectRequest(UUID tenantId, String id, String reason) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    request.setStatus(RequestStatus.rejected);
    request.setRejectionReason(reason);

    return mapToResponse(requestRepository.save(request));
  }

  private Request findRequest(UUID tenantId, String id) {
    return requestRepository
        .findById(id)
        .filter(r -> r.getTenantId().equals(tenantId))
        .orElseThrow(() -> new IllegalArgumentException("Request not found"));
  }

  private void validatePending(Request request) {
    if (!RequestStatus.pending.equals(request.getStatus())) {
      throw new IllegalStateException("Request is already " + request.getStatus().getValue());
    }
  }

  private RequestResponse mapToResponse(Request request) {
    return new RequestResponse(
        request.getId(),
        request.getRequestId(),
        request.getStatus(),
        request.getName(),
        request.getContext(),
        request.getRequiredMetadata(),
        request.getRequiredFieldsInSecretValue(),
        request.getMappedSecretId(),
        request.getRejectionReason(),
        request.getCreatedAt(),
        request.getUpdatedAt());
  }
}
