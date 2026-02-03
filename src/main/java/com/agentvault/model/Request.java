package com.agentvault.model;

import java.util.List;
import java.util.Map;
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

  private String name;

  private String context;

  private Map<String, Object> requiredMetadata;

  private List<String> requiredFieldsInSecretValue;

    private String mappedSecretId; // ObjectId of the secret fulfilling this request

    private String rejectionReason;

    private String fulfillmentUrl;

  }
