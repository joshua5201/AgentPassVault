package com.agentvault.controller;

import com.agentvault.dto.*;
import com.agentvault.security.AgentVaultAuthentication;
import com.agentvault.service.AuthService;
import com.agentvault.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/change-password")
    public void changePassword(
            AgentVaultAuthentication authentication,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(
                (UUID) authentication.getPrincipal(),  
                request.oldPassword(), 
                request.newPassword()
        );
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String token = userService.initiatePasswordReset(request.tenantId(), request.username());
        // In a real app, we would send an email. Here we return it for dev/test.
        // Or we just return "If user exists, email sent" security-wise.
        // But the plan says "now we don't want to integrate email but we can prepare the api first".
        // Returning the token allows testing without email infrastructure.
        return Map.of("resetToken", token);
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.token(), request.newPassword());
    }

    @GetMapping("/ping")
    public Map<String, Object> ping(AgentVaultAuthentication authentication) {
        return Map.of(
            "message", "pong",
            "tenantId", authentication.getTenantId()
        );
    }
}
