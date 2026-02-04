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

import java.util.Map;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "secrets")
@CompoundIndexes({
  @CompoundIndex(name = "metadata_service_idx", def = "{'metadata.service': 1}"),
  @CompoundIndex(name = "metadata_env_idx", def = "{'metadata.env': 1}"),
  @CompoundIndex(name = "metadata_url_idx", def = "{'metadata.url': 1}")
})
public class Secret extends BaseEntity {

  @Id private String id; // ObjectId

  @Indexed private UUID tenantId;

  @TextIndexed private String name;

  private byte[] encryptedValue;

  // Flexible metadata map, specific keys indexed via @CompoundIndexes above
  private Map<String, Object> metadata;

  private SecretVisibility visibility = SecretVisibility.VISIBLE;
}
