package com.verifyauth.dto.brand;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BatchSummary {
    private String batchId;
    private Integer quantity;
    private LocalDateTime createdAt;
    private String productName;
}
