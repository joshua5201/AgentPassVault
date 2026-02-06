/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Type;

@Data
@Entity
@Table(name = "requests")
@EqualsAndHashCode(callSuper = true)
public class Request extends BaseEntity {

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "tenant_id", nullable = false)
  private Tenant tenant;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "requester_id", nullable = false)
  private User requester;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private RequestStatus status;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false)
  private RequestType type = RequestType.CREATE;

  @Column(name = "name")
  private String name;

  @Column(name = "context", columnDefinition = "TEXT")
  private String context;

  @Type(JsonType.class)
  @Column(name = "required_metadata", columnDefinition = "json")
  private Map<String, Object> requiredMetadata;

  @Type(JsonType.class)
  @Column(name = "required_fields", columnDefinition = "json")
  private List<String> requiredFieldsInSecretValue;

  @Column(name = "mapped_secret_id")
  private Long mappedSecretId;

  @Column(name = "requested_secret_id")
  private Long secretId;

  @Column(name = "rejection_reason")
  private String rejectionReason;

  @Column(name = "fulfillment_url")
  private String fulfillmentUrl;
}
