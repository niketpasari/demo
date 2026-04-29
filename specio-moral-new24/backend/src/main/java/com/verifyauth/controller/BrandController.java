package com.verifyauth.controller;

import com.verifyauth.dto.brand.*;
import com.verifyauth.dto.common.ApiResponse;
import com.verifyauth.entity.User;
import com.verifyauth.service.BrandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/brand")
@RequiredArgsConstructor
@Tag(name = "Brand", description = "Brand management and code generation APIs")
public class BrandController {

    private final BrandService brandService;

    @PostMapping("/register")
    @Operation(summary = "Register a new brand", description = "Creates a new brand account and sends activation email")
    public ResponseEntity<ApiResponse<String>> registerBrand(
            @Valid @RequestBody BrandRegisterRequest request
    ) {
        String message = brandService.registerBrand(request);
        return ResponseEntity.ok(ApiResponse.success(message, "Brand registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Brand login", description = "Authenticate as a brand admin")
    public ResponseEntity<ApiResponse<BrandAuthResponse>> loginBrand(
            @RequestBody LoginRequest request
    ) {
        BrandAuthResponse response = brandService.loginBrand(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping("/{brandId}/dashboard")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get brand dashboard", description = "Get dashboard statistics and data for a brand")
    public ResponseEntity<ApiResponse<BrandDashboardResponse>> getDashboard(
            @PathVariable UUID brandId,
            @AuthenticationPrincipal User currentUser
    ) {
        BrandDashboardResponse response = brandService.getDashboard(brandId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{brandId}/codes/generate")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Generate scratch codes", description = "Generate unique scratch codes for products (multiples of 100)")
    public ResponseEntity<ApiResponse<CodeGenerationResponse>> generateCodes(
            @PathVariable UUID brandId,
            @Valid @RequestBody CodeGenerationRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        CodeGenerationResponse response = brandService.generateCodes(brandId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Codes generated successfully"));
    }

    @GetMapping("/{brandId}/products")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get brand products", description = "Get all products for a brand")
    public ResponseEntity<ApiResponse<List<ProductSummary>>> getProducts(
            @PathVariable UUID brandId,
            @AuthenticationPrincipal User currentUser
    ) {
        List<ProductSummary> products = brandService.getProducts(brandId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping("/{brandId}/products")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Create a new product", description = "Register a new product for the brand")
    public ResponseEntity<ApiResponse<ProductSummary>> createProduct(
            @PathVariable UUID brandId,
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        ProductSummary product = brandService.createProduct(brandId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(product, "Product created successfully"));
    }

    @PostMapping("/{brandId}/special-offer")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Enable special offer", description = "Enable special offer for codes by batch or product")
    public ResponseEntity<ApiResponse<Void>> enableSpecialOffer(
            @PathVariable UUID brandId,
            @Valid @RequestBody SpecialOfferRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        brandService.enableSpecialOffer(brandId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Special offer enabled successfully"));
    }

    @GetMapping("/{brandId}/codes")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get scratch codes", description = "Get scratch codes for a brand with optional filters")
    public ResponseEntity<ApiResponse<CodeListResponse>> getCodes(
            @PathVariable UUID brandId,
            @RequestParam(required = false) String productId,
            @RequestParam(required = false) String batchId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        CodeListResponse response = brandService.getCodes(brandId, productId, batchId, status, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{brandId}/special-offer/codes")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Enable special offer for specific codes", description = "Enable special offer for individually selected codes or random selection")
    public ResponseEntity<ApiResponse<SpecialOfferResponse>> enableSpecialOfferForCodes(
            @PathVariable UUID brandId,
            @Valid @RequestBody SpecialOfferCodesRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        SpecialOfferResponse response = brandService.enableSpecialOfferForCodes(brandId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Special offer enabled for " + response.getUpdatedCount() + " codes"));
    }

    @GetMapping("/{brandId}/verification-report")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get verification report", description = "Get verification report with verified, suspicious, and failed items")
    public ResponseEntity<ApiResponse<VerificationReportResponse>> getVerificationReport(
            @PathVariable UUID brandId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @AuthenticationPrincipal User currentUser
    ) {
        VerificationReportResponse response = brandService.getVerificationReport(brandId, status, location, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{brandId}/codes/{code}/details")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get code details", description = "Get detailed information about a specific code including verification history")
    public ResponseEntity<ApiResponse<CodeDetailsResponse>> getCodeDetails(
            @PathVariable UUID brandId,
            @PathVariable String code,
            @AuthenticationPrincipal User currentUser
    ) {
        CodeDetailsResponse response = brandService.getCodeDetails(brandId, code, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{brandId}/billing")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Get brand billing info", description = "Get monthly code generation and payment status")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getBrandBilling(
            @PathVariable java.util.UUID brandId,
            @AuthenticationPrincipal User currentUser
    ) {
        java.util.List<java.util.Map<String, Object>> billing = brandService.getBrandBillingForPortal(brandId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(billing));
    }

    @PutMapping("/reset-password")
    @PreAuthorize("hasRole('BRAND_ADMIN')")
    @Operation(summary = "Reset brand user password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User currentUser
    ) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        brandService.resetPassword(currentUser, currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
    }

    // Inner class for login request (simple)
    @lombok.Data
    public static class LoginRequest {
        private String email;
        private String password;
    }
}
