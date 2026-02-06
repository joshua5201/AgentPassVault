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
import com.agentvault.model.Tenant;
import com.agentvault.model.User;
import com.agentvault.repository.RequestRepository;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestService {

  private final RequestRepository requestRepository;
  private final SecretRepository secretRepository;
  private final TenantRepository tenantRepository;
  private final UserRepository userRepository;
  private final SecretService secretService;
  private final FulfillmentUrlService fulfillmentUrlService;
  private final TokenService tokenService;

  @Transactional
  public RequestResponse createRequest(Long tenantId, Long requesterId, CreateRequestDTO dto) {
    Tenant tenant =
        tenantRepository
            .findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

    User requester =
        userRepository
            .findById(requesterId)
            .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

    Request request = new Request();
    request.setTenant(tenant);
    request.setRequester(requester);
    request.setStatus(RequestStatus.pending);
    request.setName(dto.name());
    request.setContext(dto.context());
    request.setRequiredMetadata(dto.requiredMetadata());
    request.setRequiredFieldsInSecretValue(dto.requiredFieldsInSecretValue());
    request.setType(dto.type());
    if (dto.secretId() != null) {
      request.setSecretId(Long.valueOf(dto.secretId()));
    }

    // Generate and set the URL
    request.setFulfillmentUrl(fulfillmentUrlService.generate(request));

    return mapToResponse(requestRepository.save(request));
  }

  public RequestResponse getRequest(Long tenantId, Long requestId) {
    return mapToResponse(findRequest(tenantId, requestId));
  }

  @Transactional
  public RequestResponse fulfillRequest(Long tenantId, Long requestId, FulfillRequestDTO dto) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    // Create the secret
    CreateSecretRequest secretRequest =
        new CreateSecretRequest(dto.name(), dto.value(), dto.metadata());
    SecretMetadataResponse secret = secretService.createSecret(tenantId, secretRequest);

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(Long.valueOf(secret.secretId()));

    return mapToResponse(requestRepository.save(request));
  }

  @Transactional
  public RequestResponse mapRequest(Long tenantId, Long requestId, MapRequestDTO dto) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    Long secretId = Long.valueOf(dto.secretId());

    // Verify secret exists and belongs to tenant
    secretRepository
        .findById(secretId)
        .filter(s -> s.getTenant().getId().equals(tenantId))
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
    request.setMappedSecretId(secretId);

    return mapToResponse(requestRepository.save(request));
  }

  @Transactional
  public ApproveLeaseResponseDTO approveLease(Long tenantId, Long requestId, String approverId) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    if (request.getType() != com.agentvault.model.RequestType.LEASE) {
      throw new IllegalStateException("Request is not a lease request");
    }

    String leaseToken =
        tokenService.generateLeaseToken(
            tenantId,
            request.getRequester().getId().toString(),
            approverId,
            request.getSecretId().toString(),
            request.getId().toString());

    request.setStatus(RequestStatus.fulfilled);
    requestRepository.save(request);

    return new ApproveLeaseResponseDTO(leaseToken);
  }

  @Transactional
  public RequestResponse rejectRequest(Long tenantId, Long requestId, String reason) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    request.setStatus(RequestStatus.rejected);
    request.setRejectionReason(reason);

    return mapToResponse(requestRepository.save(request));
  }

  @Transactional
  public void abandonRequest(Long tenantId, Long requesterId, Long requestId) {
    Request request = findRequest(tenantId, requestId);
    if (!request.getRequester().getId().equals(requesterId)) {
      throw new IllegalStateException("Only the requester can abandon the request");
    }
    validatePending(request);

    request.setStatus(RequestStatus.abandoned);
    requestRepository.save(request);
  }

  private Request findRequest(Long tenantId, Long requestId) {
    return requestRepository
        .findById(requestId)
        .filter(r -> r.getTenant().getId().equals(tenantId))
        .orElseThrow(() -> new IllegalArgumentException("Request not found"));
  }

  private void validatePending(Request request) {
    if (!RequestStatus.pending.equals(request.getStatus())) {
      throw new IllegalStateException("Request is already " + request.getStatus().getValue());
    }
  }

  private RequestResponse mapToResponse(Request request) {
    return new RequestResponse(
        request.getId().toString(),
        request.getStatus(),
        request.getType(),
        request.getName(),
        request.getContext(),
        request.getRequiredMetadata(),
        request.getRequiredFieldsInSecretValue(),
        request.getMappedSecretId() != null ? request.getMappedSecretId().toString() : null,
        request.getRejectionReason(),
        request.getFulfillmentUrl(),
        request.getCreatedAt(),
        request.getUpdatedAt());
  }
}
