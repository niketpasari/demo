package com.verifyauth.dto.verification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {

    private String verificationId;
    private String result;
    private String message;
    private LocalDateTime verifiedAt;
    private Boolean isFirstVerification;
    private Integer verificationCount;
    
    private ProductInfo product;
    private BrandInfo brand;
    private VerificationDetails details;
    private SpecialOfferInfo specialOffer;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductInfo {
        private String id;
        private String name;
        private String description;
        private String modelNumber;
        private String category;
        private String imageUrl;
        private BigDecimal price;
        private LocalDate manufacturingDate;
        private String manufacturingLocation;
        private String batchNumber;
        private Integer warrantyMonths;
        private LocalDate warrantyExpiry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrandInfo {
        private String id;
        private String name;
        private String description;
        private String logoUrl;
        private String websiteUrl;
        private String supportEmail;
        private String supportPhone;
        private Boolean verificationBadge;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationDetails {
        private String scratchCode;
        private LocalDateTime firstVerifiedAt;
        private String firstVerifiedBy;
        private Integer totalVerifications;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecialOfferInfo {
        private Boolean hasSpecialOffer;
        private String description;
        private Integer discountPercent;
        private LocalDateTime validUntil;
        private Boolean isExpired;
    }
}
