package com.verifyauth.dto.verification;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ReportFailedVerificationRequest {
    
    @NotBlank(message = "Attempted code is required")
    private String attemptedCode;
    
    private UUID reportedBrandId;
    
    private String location;
}
