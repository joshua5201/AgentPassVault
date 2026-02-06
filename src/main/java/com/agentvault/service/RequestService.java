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
import com.agentvault.model.*;
import com.agentvault.repository.*;
import java.time.Instant;
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
  private final LeaseRepository leaseRepository;
  private final SecretService secretService;
  private final FulfillmentUrlService fulfillmentUrlService;

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

    // 1. Create the secret (owner's copy)
    CreateSecretRequest secretRequest =
        new CreateSecretRequest(dto.name(), dto.ownerEncryptedData(), dto.metadata());
    SecretMetadataResponse secretMeta = secretService.createSecret(tenantId, secretRequest);

    Secret secret =
        secretRepository
            .findById(Long.valueOf(secretMeta.secretId()))
            .orElseThrow(() -> new IllegalStateException("Failed to retrieve created secret"));

    // 2. Create the lease (agent's copy)
    createLease(secret, request.getRequester(), dto.agentEncryptedData(), dto.expiry());

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(secret.getId());

    return mapToResponse(requestRepository.save(request));
  }

  @Transactional
  public RequestResponse mapRequest(Long tenantId, Long requestId, MapRequestDTO dto) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    Long secretId = Long.valueOf(dto.secretId());

    // Verify secret exists and belongs to tenant
    Secret secret =
        secretRepository
            .findById(secretId)
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    if (dto.newVisibility() != null) {
      secret.setVisibility(dto.newVisibility());
      secretRepository.save(secret);
    }

    // MAP action for a CREATE request might just link it.
    // But usually mapping requires giving access to the agent.
    // However, if the admin just wants to link it without providing encrypted blob here,
    // they might need another step.
    // DESIGN says: "Option 2: Map (Existing Secret): ... Admin leases the secret if needed."
    // If they use MAP, they probably should also provide agentEncryptedData.
    // But for now, we follow the current DTO which doesn't have it for MAP.
    // Wait, UpdateRequestDTO DOES have it now! I added it.

    request.setStatus(RequestStatus.fulfilled);
    request.setMappedSecretId(secretId);

    return mapToResponse(requestRepository.save(request));
  }

  @Transactional
  public ApproveLeaseResponseDTO approveLease(
      Long tenantId, Long requestId, String agentEncryptedData, Instant expiry) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    if (request.getType() != RequestType.LEASE) {
      throw new IllegalStateException("Request is not a lease request");
    }

    Secret secret =
        secretRepository
            .findById(request.getSecretId())
            .filter(s -> s.getTenant().getId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Secret not found"));

    // Create the lease (agent's copy)
    createLease(secret, request.getRequester(), agentEncryptedData, expiry);

    request.setStatus(RequestStatus.fulfilled);
    requestRepository.save(request);

    return new ApproveLeaseResponseDTO("LEASE_FULFILLED_SUCCESSFULLY");
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

  private void createLease(Secret secret, User agent, String encryptedData, Instant expiry) {
    Lease lease = new Lease();
    lease.setSecret(secret);
    lease.setAgent(agent);
    lease.setEncryptedData(encryptedData);
    lease.setExpiry(expiry);
    leaseRepository.save(lease);
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