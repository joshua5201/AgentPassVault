/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "idempotency_records")
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyRecord {

  @Id
  @Column(name = "id")
  private String id; // TenantId + ":" + IdempotencyKey

  @Column(name = "response_body", columnDefinition = "LONGTEXT")
  private String responseBody;

  @Column(name = "response_status")
  private int responseStatus;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;
}
