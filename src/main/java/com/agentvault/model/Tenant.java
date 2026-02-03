package com.agentvault.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "tenants")
public class Tenant extends BaseEntity {

    @Id
    private UUID id;
    private String name;
    private byte[] encryptedTenantKey;
    private String status;

}
