package com.agentvault.controller;

import com.agentvault.dto.LoginRequest;
import com.agentvault.dto.LoginResponse;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/ping")
    public Map<String, Object> ping(AgentVaultAuthentication authentication) {
        return Map.of(
            "message", "pong",
            "tenantId", authentication.getTenantId()
        );
    }
}
