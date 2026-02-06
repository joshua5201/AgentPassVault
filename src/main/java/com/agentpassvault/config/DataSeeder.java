/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.config;

import com.agentpassvault.model.Tenant;
import com.agentpassvault.repository.TenantRepository;
import com.agentpassvault.service.UserService;
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

  @Override
  public void run(String... args) {
    if (tenantRepository.count() > 0) {
      log.info("Database already seeded. Skipping initialization.");
      return;
    }

    log.info("Seeding database with default tenant and admin user...");

    // Create Tenant
    Tenant tenant = new Tenant();
    tenant.setName("Dev Tenant");
    tenant.setStatus("active");
    tenant = tenantRepository.save(tenant);
    log.info("Created Default Tenant: ID={}", tenant.getId());

    // Create Admin User
    String username = "devadmin";
    String rawPassword = System.getenv("AGENTPASSVAULT_DEV_PASSWORD");

    if (rawPassword == null || rawPassword.isBlank()) {
      throw new IllegalStateException(
          "AGENTPASSVAULT_DEV_PASSWORD environment variable is required for data seeding in dev profile.");
    }

    rawPassword = rawPassword.trim();

    userService.createAdminUser(tenant.getId(), username, rawPassword, "Default Admin");

    log.info("Created Admin User: username={}", username);
  }
}
