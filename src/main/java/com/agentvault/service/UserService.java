package com.agentvault.service;

import com.agentvault.model.Role;
import com.agentvault.model.User;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
    user.setRole(Role.admin);

    return userRepository.save(user);
  }

  public User createAgentUser(UUID tenantId, String appTokenHash) {
    validateTenant(tenantId);

    User user = new User();
    user.setId(UUID.randomUUID());
    user.setTenantId(tenantId);
    user.setRole(Role.agent);
    user.setAppTokenHash(appTokenHash);

    return userRepository.save(user);
  }

  public void changePassword(UUID userId, String oldPassword, String newPassword) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid old password");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordLastUpdatedAt(LocalDateTime.now(ZoneId.of("UTC")));
    userRepository.save(user);
  }

  public String initiatePasswordReset(UUID tenantId, String username) {
    validateTenant(tenantId);
    User user =
        userRepository
            .findByTenantIdAndUsername(tenantId, username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    String token = UUID.randomUUID().toString();
    user.setResetPasswordToken(token);
    // Token expires in 15 minutes
    user.setResetPasswordExpiresAt(LocalDateTime.now(ZoneId.of("UTC")).plusMinutes(15));
    userRepository.save(user);

    return token;
  }

  public void resetPassword(String token, String newPassword) {
    User user =
        userRepository
            .findByResetPasswordToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

    if (user.getResetPasswordExpiresAt() == null
        || user.getResetPasswordExpiresAt().isBefore(LocalDateTime.now(ZoneId.of("UTC")))) {
      throw new IllegalArgumentException("Invalid or expired reset token");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordLastUpdatedAt(LocalDateTime.now(ZoneId.of("UTC")));
    user.setResetPasswordToken(null);
    user.setResetPasswordExpiresAt(null);
    userRepository.save(user);
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
