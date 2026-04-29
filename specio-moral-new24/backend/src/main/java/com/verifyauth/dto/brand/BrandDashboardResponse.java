package com.verifyauth.dto.brand;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BrandDashboardResponse {
    private String brandId;
    private String brandName;
    private Long totalCodes;
    private Long verifiedCodes;
    private Long unusedCodes;
    private Long suspiciousCodes;
    private Long failedVerifications;
    private Integer totalProducts;
    private List<ProductSummary> products;
    private List<BatchSummary> recentBatches;
}
