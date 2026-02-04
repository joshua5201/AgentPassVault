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
  private final FulfillmentUrlService fulfillmentUrlService;
  private final TokenService tokenService;

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
    request.setType(dto.type());
    request.setSecretId(dto.secretId());

    // Generate and set the URL
    request.setFulfillmentUrl(fulfillmentUrlService.generate(request));

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

  public RequestResponse mapRequest(UUID tenantId, String id, MapRequestDTO dto) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    // Verify secret exists and belongs to tenant
    secretRepository
        .findById(dto.secretId())
        .filter(s -> s.getTenantId().equals(tenantId))
        .ifPresentOrElse(
            secret -> {
              if (dto.newVisibility() != null) {
                secret.setVisibility(dto.newVisibility());
                secretRepository.save(secret);
              }
            },
            () -> {
              throw new IllegalArgumentException("Secret not found");
            });

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(dto.secretId());

    return mapToResponse(requestRepository.save(request));
  }

  public ApproveLeaseResponseDTO approveLease(UUID tenantId, String id, String approverId) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    if (request.getType() != com.agentvault.model.RequestType.LEASE) {
      throw new IllegalStateException("Request is not a lease request");
    }

    String leaseToken =
        tokenService.generateLeaseToken(
            tenantId,
            request.getRequesterId().toString(),
            approverId,
            request.getSecretId(),
            request.getId());

    request.setStatus(RequestStatus.fulfilled);
    requestRepository.save(request);

    return new ApproveLeaseResponseDTO(leaseToken);
  }

  public RequestResponse rejectRequest(UUID tenantId, String id, String reason) {
    Request request = findRequest(tenantId, id);
    validatePending(request);

    request.setStatus(RequestStatus.rejected);
    request.setRejectionReason(reason);

    return mapToResponse(requestRepository.save(request));
  }

  public void abandonRequest(UUID tenantId, UUID requesterId, String id) {
    Request request = findRequest(tenantId, id);
    if (!request.getRequesterId().equals(requesterId)) {
      throw new IllegalStateException("Only the requester can abandon the request");
    }
    validatePending(request);

    request.setStatus(RequestStatus.abandoned);
    requestRepository.save(request);
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
        request.getType(),
        request.getName(),
        request.getContext(),
        request.getRequiredMetadata(),
        request.getRequiredFieldsInSecretValue(),
        request.getMappedSecretId(),
        request.getRejectionReason(),
        request.getFulfillmentUrl(),
        request.getCreatedAt(),
        request.getUpdatedAt());
  }
}
