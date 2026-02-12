/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import com.agentpassvault.dto.AgentResponse;
import com.agentpassvault.dto.AgentTokenResponse;
import com.agentpassvault.exception.ResourceNotFoundException;
import com.agentpassvault.model.Role;
import com.agentpassvault.model.User;
import com.agentpassvault.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgentService {

  private final UserRepository userRepository;
  private final UserService userService;

  @Transactional
  public AgentTokenResponse createAgent(Long tenantId, String name) {
    String appToken = generateAppToken();
    String tokenHash = hashToken(appToken);

    User agent = userService.createAgentUser(tenantId, tokenHash, name);

    return new AgentTokenResponse(agent.getId().toString(), appToken);
  }

  public List<AgentResponse> listAgents(Long tenantId) {
    return userRepository.findByTenant_IdAndRole(tenantId, Role.AGENT).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  public AgentResponse getAgentResponse(Long tenantId, Long agentId) {
    return mapToResponse(getAgent(tenantId, agentId));
  }

  @Transactional
  public AgentTokenResponse rotateToken(Long tenantId, Long agentId) {
    User agent = getAgent(tenantId, agentId);

    String newAppToken = generateAppToken();
    String tokenHash = hashToken(newAppToken);

    agent.setAppTokenHash(tokenHash);
    userRepository.save(agent);

    return new AgentTokenResponse(agent.getId().toString(), newAppToken);
  }

  @Transactional
  public void deleteAgent(Long tenantId, Long agentId) {
    User agent = getAgent(tenantId, agentId);
    userRepository.delete(agent);
  }

  @Transactional
  public void registerPublicKey(Long tenantId, Long agentId, String publicKey) {
    User agent = getAgent(tenantId, agentId);
    agent.setPublicKey(publicKey);
    userRepository.save(agent);
  }

  private User getAgent(Long tenantId, Long agentId) {
    return userRepository
        .findById(agentId)
        .filter(u -> u.getTenant().getId().equals(tenantId) && Role.AGENT.equals(u.getRole()))
        .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
  }

  private AgentResponse mapToResponse(User user) {
    return new AgentResponse(
        user.getId().toString(),
        user.getUsername(),
        user.getDisplayName(),
        user.getPublicKey(),
        user.getCreatedAt());
  }

  private String generateAppToken() {
    byte[] randomBytes = new byte[32];
    new SecureRandom().nextBytes(randomBytes);
    return "at_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("Error hashing token", e);
    }
  }
}
