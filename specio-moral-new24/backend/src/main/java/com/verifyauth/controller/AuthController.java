package com.verifyauth.controller;

import com.verifyauth.dto.auth.AuthResponse;
import com.verifyauth.dto.auth.LoginRequest;
import com.verifyauth.dto.auth.RegisterRequest;
import com.verifyauth.dto.common.ApiResponse;
import com.verifyauth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Create a new user account and send activation email")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, "Registration successful"));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate user and get JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Activate account using the email verification token")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email", description = "Resend the activation email to user")
    public ResponseEntity<ApiResponse<String>> resendVerification(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String message = authService.resendVerification(email);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Get new access token using refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestHeader("Authorization") String refreshToken
    ) {
        // Remove "Bearer " prefix if present
        if (refreshToken.startsWith("Bearer ")) {
            refreshToken = refreshToken.substring(7);
        }
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Invalidate user session")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // JWT tokens are stateless, so logout is handled client-side
        // In production, you might want to implement token blacklisting
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }
}
