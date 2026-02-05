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
package com.agentvault.dto;

import com.agentvault.model.RequestStatus;
import com.agentvault.model.RequestType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record RequestResponse(
    UUID requestId,
    RequestStatus status,
    RequestType type,
    String name,
    String context,
    Map<String, Object> requiredMetadata,
    List<String> requiredFieldsInSecretValue,
    UUID mappedSecretId,
    String rejectionReason,
    String fulfillmentUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
