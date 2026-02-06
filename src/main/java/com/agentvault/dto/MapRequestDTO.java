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

import com.agentvault.model.SecretVisibility;

import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.Pattern;



public record MapRequestDTO(

    @NotNull(message = "Secret ID cannot be null")

    @Pattern(regexp = "^[0-9]+$", message = "Secret ID must be numeric")

    String secretId,

    SecretVisibility newVisibility) {}
