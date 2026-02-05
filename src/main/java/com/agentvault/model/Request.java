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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "requests")
public class Request extends BaseEntity {

  @Id private String id; // ObjectId

  @Indexed(unique = true)
  private UUID requestId; // Public UUID

  @Indexed private UUID tenantId;

  private UUID requesterId;

  @Indexed
  @Field(targetType = FieldType.STRING)
  private RequestStatus status;

  @Field(targetType = FieldType.STRING)
  private RequestType type = RequestType.CREATE;

  private String name;

  private String context;

  private Map<String, Object> requiredMetadata;

  private List<String> requiredFieldsInSecretValue;

  private UUID mappedSecretId; // public secretId of the secret fulfilling this request

  private UUID secretId; // public secretId of the secret being requested for lease

  private String rejectionReason;

  private String fulfillmentUrl;

  @CreatedDate private LocalDateTime createdAt;

  @LastModifiedDate private LocalDateTime updatedAt;
}
