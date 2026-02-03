package com.agentvault.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "secrets")
@CompoundIndexes({
    @CompoundIndex(name = "metadata_service_idx", def = "{'metadata.service': 1}"),
    @CompoundIndex(name = "metadata_env_idx", def = "{'metadata.env': 1}"),
    @CompoundIndex(name = "metadata_url_idx", def = "{'metadata.url': 1}")
})
public class Secret extends BaseEntity {

    @Id
    private String id; // ObjectId

    @Indexed
    private UUID tenantId;

    @TextIndexed
    private String name;

    private byte[] encryptedValue;

    // Flexible metadata map, specific keys indexed via @CompoundIndexes above
    private Map<String, Object> metadata;

}
