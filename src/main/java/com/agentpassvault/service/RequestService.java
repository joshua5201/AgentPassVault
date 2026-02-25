/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.dto.CreateRequestRequest;
import com.agentpassvault.dto.RequestResponse;
import com.agentpassvault.dto.UpdateRequestRequest;
import com.agentpassvault.exception.ResourceNotFoundException;
import com.agentpassvault.model.*;
import com.agentpassvault.repository.*;
import java.util.List;
import java.util.stream.Collectors;
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
  private final FulfillmentUrlService fulfillmentUrlService;

  public List<RequestResponse> listRequests(Long tenantId) {
    return requestRepository.findAllByTenantId(tenantId).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public RequestResponse createRequest(Long tenantId, Long requesterId, CreateRequestRequest dto) {
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

    // Persist to obtain an ID, then generate & set the fulfillment URL and persist again
    Request saved = requestRepository.save(request);
    saved.setFulfillmentUrl(fulfillmentUrlService.generate(saved));
    Request finalSaved = requestRepository.save(saved);

    return mapToResponse(finalSaved);
  }

  public RequestResponse getRequest(Long tenantId, Long requestId) {
    return mapToResponse(findRequest(tenantId, requestId));
  }

  @Transactional
  public RequestResponse updateRequestStatus(
      Long tenantId, Long requestId, UpdateRequestRequest dto) {
    Request request = findRequest(tenantId, requestId);
    validatePending(request);

    if (dto.status() == RequestStatus.fulfilled) {
      if (dto.secretId() == null) {
        throw new IllegalArgumentException("Secret ID is required for fulfilling request");
      }
      Long secretId = Long.valueOf(dto.secretId());
      // Verify secret exists and belongs to tenant
      @SuppressWarnings("unused")
      Secret unused =
          secretRepository
              .findById(secretId)
              .filter(s -> s.getTenant().getId().equals(tenantId))
              .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

      request.setStatus(RequestStatus.fulfilled);
      request.setMappedSecretId(secretId);
    } else if (dto.status() == RequestStatus.rejected) {
      if (dto.rejectionReason() == null) {
        throw new IllegalArgumentException("Rejection reason is required");
      }
      request.setStatus(RequestStatus.rejected);
      request.setRejectionReason(dto.rejectionReason());
    } else {
      throw new IllegalArgumentException(
          "Invalid status update. Only fulfilled or rejected allowed.");
    }

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
        .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
  }

  private void validatePending(Request request) {
    if (!RequestStatus.pending.equals(request.getStatus())) {
      throw new IllegalStateException("Request is already " + request.getStatus().getValue());
    }
  }

  private RequestResponse mapToResponse(Request request) {
    return new RequestResponse(
        request.getId().toString(),
        request.getRequester().getId().toString(),
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
