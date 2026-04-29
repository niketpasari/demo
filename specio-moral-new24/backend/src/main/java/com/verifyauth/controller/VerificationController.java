package com.verifyauth.controller;

import com.verifyauth.dto.brand.BrandListDto;
import com.verifyauth.dto.common.ApiResponse;
import com.verifyauth.dto.verification.ReportFailedVerificationRequest;
import com.verifyauth.dto.verification.VerificationHistoryDto;
import com.verifyauth.dto.verification.VerificationRequest;
import com.verifyauth.dto.verification.VerificationResponse;
import com.verifyauth.dto.verification.VerificationStatsDto;
import com.verifyauth.entity.User;
import com.verifyauth.service.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/verification")
@RequiredArgsConstructor
@Tag(name = "Verification", description = "Product verification endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verify")
    @Operation(summary = "Verify product", description = "Verify a product using scratch code")
    public ResponseEntity<ApiResponse<VerificationResponse>> verifyProduct(
            @Valid @RequestBody VerificationRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest
    ) {
        VerificationResponse response = verificationService.verifyProduct(request, currentUser, httpRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get verification history", description = "Get user's verification history with pagination")
    public ResponseEntity<ApiResponse<List<VerificationHistoryDto>>> getVerificationHistory(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<VerificationHistoryDto> history = verificationService.getVerificationHistory(
                currentUser.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent verifications", description = "Get user's most recent verifications")
    public ResponseEntity<ApiResponse<List<VerificationHistoryDto>>> getRecentVerifications(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<VerificationHistoryDto> recent = verificationService.getRecentVerifications(
                currentUser.getId(), limit);
        return ResponseEntity.ok(ApiResponse.success(recent));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get verification details", description = "Get detailed information about a specific verification")
    public ResponseEntity<ApiResponse<VerificationResponse>> getVerificationDetails(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        VerificationResponse response = verificationService.getVerificationDetails(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get verification stats", description = "Get user's verification statistics")
    public ResponseEntity<ApiResponse<VerificationStatsDto>> getVerificationStats(
            @AuthenticationPrincipal User currentUser
    ) {
        VerificationStatsDto stats = verificationService.getVerificationStats(currentUser);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/brands")
    @Operation(summary = "Get all brands", description = "Get list of all registered brands for failed verification reporting")
    public ResponseEntity<ApiResponse<List<BrandListDto>>> getAllBrands() {
        List<BrandListDto> brands = verificationService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.success(brands));
    }

    @PostMapping("/report-failed")
    @Operation(summary = "Report failed verification", description = "Report a failed verification with optional brand information")
    public ResponseEntity<ApiResponse<String>> reportFailedVerification(
            @Valid @RequestBody ReportFailedVerificationRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest
    ) {
        verificationService.reportFailedVerification(request, currentUser, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Thank you for helping us combat counterfeits."));
    }
}
