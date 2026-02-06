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
package com.agentpassvault;

import com.agentpassvault.model.Tenant;
import com.agentpassvault.repository.LeaseRepository;
import com.agentpassvault.repository.RequestRepository;
import com.agentpassvault.repository.SecretRepository;
import com.agentpassvault.repository.TenantRepository;
import com.agentpassvault.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class BaseIntegrationTest {

  @Autowired protected MockMvc mockMvc;

  @Autowired protected ObjectMapper objectMapper;

  @Autowired protected UserRepository userRepository;

  @Autowired protected TenantRepository tenantRepository;

  @Autowired protected SecretRepository secretRepository;

  @Autowired protected RequestRepository requestRepository;

  @Autowired protected LeaseRepository leaseRepository;

  @BeforeEach
  void clearDatabase() {
    leaseRepository.deleteAll();
    requestRepository.deleteAll();
    secretRepository.deleteAll();
    userRepository.deleteAll();
    tenantRepository.deleteAll();
  }

  protected Long createTenant() {
    Tenant tenant = new Tenant();
    tenant.setName("Test Tenant " + java.util.UUID.randomUUID());
    tenant.setStatus("active");

    return tenantRepository.save(tenant).getId();
  }
}
