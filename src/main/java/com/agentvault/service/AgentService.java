package com.agentvault.service;

import com.agentvault.dto.AgentResponse;
import com.agentvault.dto.AgentTokenResponse;
import com.agentvault.model.User;
import com.agentvault.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final UserRepository userRepository;
    private final UserService userService;

    public AgentTokenResponse createAgent(UUID tenantId, String name) {
        String appToken = generateAppToken();
        String tokenHash = hashToken(appToken);

        User agent = userService.createAgentUser(tenantId, tokenHash);
        agent.setUsername(name); // Set the name
        userRepository.save(agent); // Update name

        return new AgentTokenResponse(agent.getId(), appToken);
    }

    public List<AgentResponse> listAgents(UUID tenantId) {
        // Assuming agents are Users with role "agent"
        // UserRepository doesn't have a findByTenantIdAndRole yet?
        // I'll need to add it or filter.
        // Let's assume we add findByTenantIdAndRole
        return userRepository.findAll().stream()
                .filter(u -> u.getTenantId().equals(tenantId) && "agent".equals(u.getRole()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AgentTokenResponse rotateToken(UUID tenantId, UUID agentId) {
        User agent = getAgent(tenantId, agentId);
        
        String newAppToken = generateAppToken();
        String tokenHash = hashToken(newAppToken);
        
        agent.setAppTokenHash(tokenHash);
        userRepository.save(agent);
        
        return new AgentTokenResponse(agent.getId(), newAppToken);
    }

    public void deleteAgent(UUID tenantId, UUID agentId) {
        User agent = getAgent(tenantId, agentId);
        userRepository.delete(agent);
    }

    private User getAgent(UUID tenantId, UUID agentId) {
        return userRepository.findById(agentId)
                .filter(u -> u.getTenantId().equals(tenantId) && "agent".equals(u.getRole()))
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));
    }

    private AgentResponse mapToResponse(User user) {
        return new AgentResponse(user.getId(), user.getUsername(), user.getCreatedAt());
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
