package com.agentvault.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Document(collection = "requests")
public class Request {

    @Id
    private String id; // ObjectId

    @Indexed(unique = true)
    private UUID requestId; // Public UUID

    @Indexed
    private UUID tenantId;

    private UUID requesterId;

    @Indexed
    private String status; // pending, fulfilled, rejected

    private String name;
    private String context;

    private Map<String, Object> requiredMetadata;
    private List<String> requiredFieldsInSecretValue;

    private String mappedSecretId; // ObjectId of the secret fulfilling this request
    private String rejectionReason;

    private LocalDateTime createdAt;

}
