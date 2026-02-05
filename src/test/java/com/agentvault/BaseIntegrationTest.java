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
package com.agentvault;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.agentvault.model.Tenant;
import com.agentvault.repository.RequestRepository;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import com.agentvault.service.crypto.KeyManagementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class BaseIntegrationTest {

  private static final Logger log = LoggerFactory.getLogger(BaseIntegrationTest.class);

  @Autowired protected MockMvc mockMvc;

  @Autowired protected ObjectMapper objectMapper;

  @Autowired protected UserRepository userRepository;

  @Autowired protected TenantRepository tenantRepository;

  @Autowired protected SecretRepository secretRepository;

  @Autowired protected RequestRepository requestRepository;

  @Autowired protected KeyManagementService keyManagementService;

  @Autowired protected org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

  @BeforeEach
  void clearDatabase() {
    mongoTemplate.dropCollection(com.agentvault.model.User.class);
    mongoTemplate.dropCollection(com.agentvault.model.Tenant.class);
    mongoTemplate.dropCollection(com.agentvault.model.Secret.class);
    mongoTemplate.dropCollection(com.agentvault.model.Request.class);
  }

  protected UUID createTenant() {
    UUID tenantId = UUID.randomUUID();
    Tenant tenant = new Tenant();
    tenant.setId(tenantId.toString());
    tenant.setTenantId(tenantId);
    tenant.setName("Test Tenant");
    tenant.setStatus("active");

    byte[] encryptedTenantKey = keyManagementService.generateEncryptedTenantKey();
    assertNotNull(encryptedTenantKey, "Encrypted tenant key should not be null");
    log.info("Generated encryptedTenantKey with length: {}", encryptedTenantKey.length);

    tenant.setEncryptedTenantKey(encryptedTenantKey);
    tenantRepository.save(tenant);
    return tenantId;
  }
}
