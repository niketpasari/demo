package com.verifyauth.dto.verification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationHistoryDto {

    private String id;
    private String scratchCode;
    private String result;
    private LocalDateTime verifiedAt;
    private String productName;
    private String productImageUrl;
    private String brandName;
    private String brandLogoUrl;
    private String category;
}
