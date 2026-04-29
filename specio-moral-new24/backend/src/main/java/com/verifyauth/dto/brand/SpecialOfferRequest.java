package com.verifyauth.dto.brand;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SpecialOfferRequest {
    // Either batchId or productId must be provided
    private String batchId;
    private String productId;
    
    @NotBlank(message = "Offer description is required")
    private String description;
    
    private Integer discountPercent;
    
    private LocalDateTime validUntil;
}
