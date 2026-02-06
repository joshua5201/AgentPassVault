/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "users")
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "tenant_id", nullable = false)
  private Tenant tenant;

  @Column(name = "username", unique = true, nullable = false)
  private String username;

  @Column(name = "display_name")
  private String displayName;

  @Column(name = "password_hash")
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false)
  private Role role;

  @Column(name = "app_token_hash")
  private String appTokenHash;

  @Column(name = "reset_password_token")
  private String resetPasswordToken;

  @Column(name = "reset_password_expires_at")
  private Instant resetPasswordExpiresAt;

  @Column(name = "reset_password_token_created_at")
  private Instant resetPasswordTokenCreatedAt;

  @Column(name = "password_last_updated_at")
  private Instant passwordLastUpdatedAt;

  @Column(name = "public_key", columnDefinition = "TEXT")
  private String publicKey;

  @Column(name = "encrypted_master_key_salt")
  private String encryptedMasterKeySalt;
}
