package com.verifyauth.dto.brand;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CodeGenerationRequest {
    
    @NotNull(message = "Quantity is required")
    @Min(value = 100, message = "Minimum quantity is 100")
    private Integer quantity;
    
    // Either productId or newProduct must be provided
    private UUID productId;
    
    private NewProductRequest newProduct;
    
    // Special offer fields
    private Boolean hasSpecialOffer;
    private String specialOfferDescription;
    private Integer specialOfferDiscountPercent;
    private LocalDateTime specialOfferValidUntil;

    @Data
    public static class NewProductRequest {
        private String name;
        private String description;
        private String modelNumber;
        private String category;
    }
}
