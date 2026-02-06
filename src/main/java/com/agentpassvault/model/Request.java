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
