package com.agentvault.service;

import com.agentvault.model.User;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;

    public User createAdminUser(UUID tenantId, String username, String rawPassword) {
        validateTenant(tenantId);
        
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole("admin");
        
        return userRepository.save(user);
    }

    public User createAgentUser(UUID tenantId, String appTokenHash) {
        validateTenant(tenantId);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setRole("agent");
        user.setAppTokenHash(appTokenHash);
        
        return userRepository.save(user);
    }

    private void validateTenant(UUID tenantId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID cannot be null");
        }
        if (!tenantRepository.existsById(tenantId)) {
            throw new IllegalArgumentException("Tenant not found with ID: " + tenantId);
        }
    }
}
