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
package com.agentvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "leases")
@EqualsAndHashCode(callSuper = true)
public class Lease extends BaseEntity {

  @Column(name = "lease_id", unique = true, nullable = false)
  private UUID leaseId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "secret_id", nullable = false)
  private Secret secret;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "agent_id", nullable = false)
  private User agent;

  @Column(name = "encrypted_data", columnDefinition = "TEXT")
  private String encryptedData;

  @Column(name = "expiry")
  private Instant expiry;
}
