package com.verifyauth.dto.brand;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductSummary {
    private String id;
    private String name;
    private String description;
    private String modelNumber;
    private String category;
    private String imageUrl;
    private Long totalCodes;
}
