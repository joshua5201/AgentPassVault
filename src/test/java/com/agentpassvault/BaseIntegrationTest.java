/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault;

import com.agentpassvault.model.Tenant;
import com.agentpassvault.repository.LeaseRepository;
import com.agentpassvault.repository.RequestRepository;
import com.agentpassvault.repository.SecretRepository;
import com.agentpassvault.repository.TenantRepository;
import com.agentpassvault.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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
