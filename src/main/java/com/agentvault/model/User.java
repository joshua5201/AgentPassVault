package com.agentvault.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Document(collection = "users")
public class User {

    @Id
    private UUID id;

    @Indexed
    private UUID tenantId;

    private String username;
    private String passwordHash;
    private String role;
    private String appTokenHash;

    @Indexed
    private String resetPasswordToken;
    private LocalDateTime resetPasswordExpiresAt;
    private LocalDateTime passwordLastUpdatedAt;

}
