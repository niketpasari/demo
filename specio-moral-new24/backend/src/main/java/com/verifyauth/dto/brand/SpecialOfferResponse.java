package com.verifyauth.dto.brand;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialOfferResponse {
    private int updatedCount;
    private List<String> updatedCodes;
    private String description;
    private Integer discountPercent;
}
