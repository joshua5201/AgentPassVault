/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.dto.TotpSetupResponse;
import com.agentpassvault.model.Role;
import com.agentpassvault.model.Tenant;
import com.agentpassvault.model.User;
import com.agentpassvault.repository.TenantRepository;
import com.agentpassvault.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final TenantRepository tenantRepository;
  private final PasswordEncoder passwordEncoder;
  private final TwoFactorAuthService twoFactorAuthService;

  @Transactional
  public User createAdminUser(
      Long tenantId, String username, String rawPassword, String displayName) {
    Tenant tenant = validateAndGetTenant(tenantId);

    User user = new User();
    user.setTenant(tenant);
    user.setUsername(username);
    user.setDisplayName(displayName);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setRole(Role.ADMIN);

    return userRepository.save(user);
  }

  @Transactional
  public User createAdminUser(Long tenantId, String username, String rawPassword) {
    return createAdminUser(tenantId, username, rawPassword, null);
  }

  @Transactional
  public User createAgentUser(Long tenantId, String appTokenHash, String displayName) {
    Tenant tenant = validateAndGetTenant(tenantId);

    User user = new User();
    user.setTenant(tenant);
    user.setUsername("agent-" + java.util.UUID.randomUUID());
    user.setDisplayName(displayName);
    user.setRole(Role.AGENT);
    user.setAppTokenHash(appTokenHash);

    return userRepository.save(user);
  }

  @Transactional
  public User createAgentUser(Long tenantId, String appTokenHash) {
    return createAgentUser(tenantId, appTokenHash, null);
  }

  @Transactional
  public void changePassword(Long userId, String oldPassword, String newPassword) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid old password");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordLastUpdatedAt(Instant.now());
    userRepository.save(user);
  }

  @Transactional
  public String initiatePasswordReset(String username) {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    String token = java.util.UUID.randomUUID().toString();
    user.setResetPasswordToken(token);
    // Token expires in 15 minutes
    Instant now = Instant.now();
    user.setResetPasswordTokenCreatedAt(now);
    user.setResetPasswordExpiresAt(now.plus(15, ChronoUnit.MINUTES));
    userRepository.save(user);

    return token;
  }

  @Transactional
  public void resetPassword(String token, String newPassword) {
    User user =
        userRepository
            .findByResetPasswordToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

    Instant now = Instant.now();
    if (user.getResetPasswordExpiresAt() == null
        || user.getResetPasswordExpiresAt().isBefore(now)) {
      throw new IllegalArgumentException("Invalid or expired reset token");
    }

    // Security check: token must be created after last password update
    if (user.getPasswordLastUpdatedAt() != null
        && user.getResetPasswordTokenCreatedAt() != null
        && user.getResetPasswordTokenCreatedAt().isBefore(user.getPasswordLastUpdatedAt())) {
      throw new IllegalArgumentException(
          "Reset token is invalid (password changed after token issuance)");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setPasswordLastUpdatedAt(now);
    user.setResetPasswordToken(null);
    user.setResetPasswordExpiresAt(null);
    user.setResetPasswordTokenCreatedAt(null);
    userRepository.save(user);
  }

  @Transactional(readOnly = true)
  public TotpSetupResponse getTotpSetup(Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    String secret = twoFactorAuthService.generateSecret();
    String qrCodeUrl = twoFactorAuthService.generateQrCodeUrl(secret, user.getUsername());

    return new TotpSetupResponse(secret, qrCodeUrl);
  }

  @Transactional
  public void enableTotp(Long userId, String secret, String code) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (user.isTotpEnabled()) {
      throw new IllegalStateException("TOTP is already enabled");
    }

    if (!twoFactorAuthService.verifyCode(secret, code)) {
      throw new BadCredentialsException("Invalid 2FA code");
    }

    user.setTotpSecret(secret);
    user.setTotpEnabled(true);
    userRepository.save(user);
  }

  @Transactional
  public void disableTotp(Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    user.setTotpEnabled(false);
    user.setTotpSecret(null);
    userRepository.save(user);
  }

  private Tenant validateAndGetTenant(Long tenantId) {
    if (tenantId == null) {
      throw new IllegalArgumentException("Tenant ID cannot be null");
    }
    return tenantRepository
        .findById(tenantId)
        .orElseThrow(() -> new IllegalArgumentException("Tenant not found with ID: " + tenantId));
  }
}
