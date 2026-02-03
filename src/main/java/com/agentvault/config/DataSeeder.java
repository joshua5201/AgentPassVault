package com.agentvault.config;

import com.agentvault.model.Tenant;
import com.agentvault.model.User;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import com.agentvault.service.crypto.KeyManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final KeyManagementService keyManagementService;
    private final PasswordEncoder passwordEncoder;

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
            log.warn("AGENTVAULT_DEV_PASSWORD not set. Generating a random password.");
            rawPassword = UUID.randomUUID().toString().substring(0, 16);
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenant.getId());
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole("admin");
        userRepository.save(user);

        log.info("Created Admin User: username={}, password={}", username, rawPassword);
        log.info("!!! PLEASE SAVE THESE CREDENTIALS !!!");
    }
}
