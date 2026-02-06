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

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Map;

public record FulfillRequestDTO(
    @NotBlank(message = "Secret name cannot be blank") String name,
    @NotBlank(message = "Owner encrypted data cannot be blank") String ownerEncryptedData,
    @NotBlank(message = "Agent encrypted data cannot be blank") String agentEncryptedData,
    Instant expiry,
    Map<String, Object> metadata) {}
