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
public class CodeListResponse {
    private List<CodeItem> codes;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeItem {
        private String id;
        private String code;
        private String productId;
        private String productName;
        private String batchId;
        private String status;
        private boolean hasSpecialOffer;
        private String specialOfferDescription;
        private Integer specialOfferDiscountPercent;
        private LocalDateTime createdAt;
        private LocalDateTime verifiedAt;
        private String verificationLocation;
        private String verifiedByEmail;
    }
}
