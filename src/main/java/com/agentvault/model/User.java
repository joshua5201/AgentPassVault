package com.agentvault.model;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "users")
public class User extends BaseEntity {

  @Id private UUID id;

  @Indexed private UUID tenantId;

  private String username;
  private String passwordHash;

  @Field(targetType = FieldType.STRING)
  private Role role;

  private String appTokenHash;
  @Indexed private String resetPasswordToken;
  private LocalDateTime resetPasswordExpiresAt;
  private LocalDateTime passwordLastUpdatedAt;
}
