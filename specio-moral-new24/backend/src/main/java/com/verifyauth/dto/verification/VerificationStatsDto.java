package com.verifyauth.dto.verification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatsDto {

    private int totalVerifications;
    private int authenticCount;
    private int suspiciousCount;
    private long failedCount;
}
