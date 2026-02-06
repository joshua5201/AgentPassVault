/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "leases")
@EqualsAndHashCode(callSuper = true)
public class Lease extends BaseEntity {

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "secret_id", nullable = false)
  private Secret secret;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "agent_id", nullable = false)
  private User agent;

  @Column(name = "public_key", columnDefinition = "TEXT", nullable = false)
  private String publicKey;

  @Column(name = "encrypted_data", columnDefinition = "TEXT")
  private String encryptedData;

  @Column(name = "expiry")
  private Instant expiry;
}
