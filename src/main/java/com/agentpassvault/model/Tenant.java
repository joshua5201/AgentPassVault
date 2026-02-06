/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "tenants")
@EqualsAndHashCode(callSuper = true)
public class Tenant extends BaseEntity {

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "status")
  private String status;
}
