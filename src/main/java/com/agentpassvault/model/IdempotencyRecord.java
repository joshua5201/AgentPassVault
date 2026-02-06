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
