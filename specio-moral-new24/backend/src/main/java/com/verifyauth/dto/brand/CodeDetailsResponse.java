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
public class CodeDetailsResponse {
    private String id;
    private String code;
    private String productId;
    private String productName;
    private String batchId;
    private String status;
    private boolean hasSpecialOffer;
    private String specialOfferDescription;
    private Integer specialOfferDiscountPercent;
    private LocalDateTime specialOfferValidUntil;
    private LocalDateTime createdAt;
    private LocalDateTime firstVerifiedAt;
    private String firstVerifiedByEmail;
    private Integer verificationCount;
    private List<VerificationHistoryItem> verificationHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationHistoryItem {
        private String id;
        private String result;
        private LocalDateTime verifiedAt;
        private String verifiedByEmail;
        private String location;
        private String city;
        private String state;
        private String country;
        private String ipAddress;
    }
}
