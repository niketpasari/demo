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
public class SpecialOfferCodesRequest {
    
    // Selection mode: "individual" or "random"
    private String selectionMode;
    
    // For individual selection - list of code IDs
    private List<String> codeIds;
    
    // For random selection
    private Integer randomCount;
    private String productId;  // Optional: limit random selection to a product
    private String batchId;    // Optional: limit random selection to a batch
    
    // Special offer details
    private String description;
    private Integer discountPercent;
    private LocalDateTime validUntil;
}
