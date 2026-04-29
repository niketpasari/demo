package com.verifyauth.dto.brand;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationReportResponse {
    private Long totalCodes;
    private Long verifiedCodes;
    private Long unusedCodes;
    private Long suspiciousCodes;
    private Long failedVerifications;
    private List<VerificationItem> verifications;
    private List<FailedVerificationItem> failedItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationItem {
        private String id;
        private String code;
        private String productId;
        private String productName;
        private String batchId;
        private String status;
        private String result;
        private boolean hasSpecialOffer;
        private String specialOfferDescription;
        private LocalDateTime verifiedAt;
        private String verifiedByEmail;
        private String location;
        private String city;
        private String state;
        private String country;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailedVerificationItem {
        private String id;
        private String attemptedCode;
        private String userEmail;
        private LocalDateTime createdAt;
        private String location;
        private String city;
        private String state;
        private String country;
        private String failureReason;
    }
}
