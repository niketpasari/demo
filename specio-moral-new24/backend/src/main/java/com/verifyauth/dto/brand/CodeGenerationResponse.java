package com.verifyauth.dto.brand;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CodeGenerationResponse {
    private String batchId;
    private Integer quantity;
    private String productId;
    private String productName;
    private List<String> codes;
    private Boolean hasSpecialOffer;
    private String specialOfferDescription;
    private LocalDateTime generatedAt;
}
