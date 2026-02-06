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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "users")
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

  @Column(name = "user_id", unique = true, nullable = false)
  private UUID userId;

  @ManyToOne(fetch = FetchType.LAZY)
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
