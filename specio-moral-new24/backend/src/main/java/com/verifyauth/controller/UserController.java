package com.verifyauth.controller;

import com.verifyauth.dto.common.ApiResponse;
import com.verifyauth.dto.user.UpdateProfileRequest;
import com.verifyauth.dto.user.UserProfileDto;
import com.verifyauth.entity.User;
import com.verifyauth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get the currently authenticated user's profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(
            @AuthenticationPrincipal User currentUser
    ) {
        UserProfileDto profile = userService.getCurrentUserProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile", description = "Update the current user's profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserProfileDto profile = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    @GetMapping("/me/stats")
    @Operation(summary = "Get user stats", description = "Get verification statistics for the current user")
    public ResponseEntity<ApiResponse<UserStatsDto>> getUserStats(
            @AuthenticationPrincipal User currentUser
    ) {
        UserStatsDto stats = UserStatsDto.builder()
                .totalVerifications(currentUser.getTotalVerifications())
                .authenticCount(currentUser.getAuthenticCount())
                .suspiciousCount(currentUser.getSuspiciousCount())
                .trustScore(currentUser.getTrustScore())
                .build();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password", description = "Change the current user's password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @RequestBody java.util.Map<String, String> request
    ) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        userService.changePassword(currentUser, currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @GetMapping("/me/data")
    @Operation(summary = "Download account data", description = "Get all account data for the current user")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> downloadAccountData(
            @AuthenticationPrincipal User currentUser
    ) {
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("id", currentUser.getId().toString());
        data.put("email", currentUser.getEmail());
        data.put("firstName", currentUser.getFirstName());
        data.put("lastName", currentUser.getLastName());
        data.put("phone", currentUser.getPhone());
        data.put("trustScore", currentUser.getTrustScore());
        data.put("totalVerifications", currentUser.getTotalVerifications());
        data.put("authenticCount", currentUser.getAuthenticCount());
        data.put("suspiciousCount", currentUser.getSuspiciousCount());
        data.put("createdAt", currentUser.getCreatedAt());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserStatsDto {
        private Integer totalVerifications;
        private Integer authenticCount;
        private Integer suspiciousCount;
        private Integer trustScore;
    }
}
