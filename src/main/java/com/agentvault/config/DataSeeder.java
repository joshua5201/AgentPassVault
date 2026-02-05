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
package com.agentvault.config;

import com.agentvault.model.Tenant;
import com.agentvault.repository.TenantRepository;
import com.agentvault.service.UserService;
import com.agentvault.service.crypto.KeyManagementService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

  private final TenantRepository tenantRepository;
  private final UserService userService;
  private final KeyManagementService keyManagementService;

  @Override
  public void run(String... args) {
    if (tenantRepository.count() > 0) {
      log.info("Database already seeded. Skipping initialization.");
      return;
    }

    log.info("Seeding database with default tenant and admin user...");

    // Create Tenant
    Tenant tenant = new Tenant();
    tenant.setId(UUID.randomUUID());
    tenant.setName("Dev Tenant");
    tenant.setStatus("active");
    tenant.setEncryptedTenantKey(keyManagementService.generateEncryptedTenantKey());
    tenantRepository.save(tenant);
    log.info("Created Default Tenant: ID={}", tenant.getId());

    // Create Admin User
    String username = "devadmin";
    String rawPassword = System.getenv("AGENTVAULT_DEV_PASSWORD");

    if (rawPassword == null || rawPassword.isBlank()) {
      throw new IllegalStateException(
          "AGENTVAULT_DEV_PASSWORD environment variable is required for data seeding in dev profile.");
    }

    rawPassword = rawPassword.trim();

    log.info("Password length: {}", rawPassword.length());
    log.info("Password start char code: {}", (int) rawPassword.charAt(0));
    log.info("Password end char code: {}", (int) rawPassword.charAt(rawPassword.length() - 1));

    userService.createAdminUser(tenant.getId(), username, rawPassword);

    log.info("Created Admin User: username={}", username);
  }
}
