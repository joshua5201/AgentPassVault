/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.dto;

import java.time.Instant;

public record LeaseResponse(
    String id,
    String agentId,
    String agentName,
    String publicKey,
    String encryptedData,
    Instant expiry,
    Instant createdAt,
    Instant updatedAt) {}
