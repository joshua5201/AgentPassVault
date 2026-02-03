package com.agentvault.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Data
@Document(collection = "tenants")
public class Tenant {

    @Id
    private UUID id;
    private String name;
    private byte[] encryptedTenantKey;
    private String status;

}
