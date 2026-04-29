package com.verifyauth.dto.brand;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;
    
    private String description;
    private String modelNumber;
    private String category;
    private String imageUrl;
}
