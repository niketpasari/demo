package com.verifyauth.controller;

import com.verifyauth.dto.common.ApiResponse;
import com.verifyauth.entity.User;
import com.verifyauth.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/login")
    @Operation(summary = "Admin login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> request) {
        Map<String, Object> result = adminService.login(request.get("username"), request.get("password"));
        return ResponseEntity.ok(ApiResponse.success(result, "Admin login successful"));
    }

    @PutMapping("/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset admin password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User currentUser
    ) {
        adminService.resetPassword(request.get("currentPassword"), request.get("newPassword"), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }

    // --- Users ---

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/{userId}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user verification stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserStats(userId)));
    }

    @GetMapping("/users/{userId}/verifications")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user verification history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserVerifications(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserVerificationHistory(userId)));
    }

    // --- Brands ---

    @GetMapping("/brands")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all brands")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllBrands() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllBrands()));
    }

    @GetMapping("/brands/{brandId}/billing")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get brand billing info")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBrandBilling(@PathVariable UUID brandId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getBrandBilling(brandId)));
    }

    @PutMapping("/billing/{billingId}/mark-paid")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark billing as paid/unpaid")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markBillingPaid(
            @PathVariable UUID billingId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User currentUser
    ) {
        boolean paid = (Boolean) request.getOrDefault("paid", true);
        return ResponseEntity.ok(ApiResponse.success(adminService.markBillingPaid(billingId, paid, currentUser)));
    }

    @GetMapping("/brands/{brandId}/report")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get brand verification report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBrandReport(@PathVariable UUID brandId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getBrandReport(brandId)));
    }

    // --- Password Reset ---

    @PostMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset user password and send temp password via email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetUserPassword(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.resetUserPassword(userId), "Password reset email sent"));
    }

    @PostMapping("/brands/{brandId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset brand admin password and send temp password via email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetBrandPassword(@PathVariable UUID brandId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.resetBrandPassword(brandId), "Password reset email sent"));
    }

    @PostMapping("/brands/{brandId}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate or deactivate a brand")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleBrandActive(@PathVariable UUID brandId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.toggleBrandActive(brandId)));
    }
}
