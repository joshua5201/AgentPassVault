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
@Document(collection = "users")
public class User extends BaseEntity {

  @Id private String id; // ObjectId

  @Indexed(unique = true)
  private UUID userId;

  @Indexed private UUID tenantId;

  private String username;
  private String passwordHash;

  @Field(targetType = FieldType.STRING)
  private Role role;

  private String appTokenHash;
  @Indexed private String resetPasswordToken;
  private LocalDateTime resetPasswordExpiresAt;
  private LocalDateTime passwordLastUpdatedAt;

  @CreatedDate private java.util.Date createdAt;

  @LastModifiedDate private java.util.Date updatedAt;
}
