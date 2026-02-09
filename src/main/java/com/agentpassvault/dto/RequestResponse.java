/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import com.agentpassvault.model.RequestStatus;
import com.agentpassvault.model.RequestType;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record RequestResponse(
    String requestId,
    String agentId,
    RequestStatus status,
    RequestType type,
    String name,
    String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue,
    String mappedSecretId,
    String rejectionReason,
    String fulfillmentUrl,
    Instant createdAt,
    Instant updatedAt) {}
