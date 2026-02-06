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
package com.agentpassvault.dto;

import com.agentpassvault.model.RequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UpdateRequestDTO(
    @NotNull(message = "Status is required") RequestStatus status,
    // For FULFILL (Existing Secret)
    @Pattern(regexp = "^[0-9]+$", message = "Secret ID must be numeric") String secretId,
    // For REJECT
    String rejectionReason) {}
