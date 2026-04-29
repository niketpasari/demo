package com.verifyauth.dto.verification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerificationRequest {

    @NotBlank(message = "Scratch code is required")
    @Pattern(regexp = "^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$", 
             message = "Invalid code format. Expected format: XXXX-XXXX-XXXX-XXXX")
    private String code;

    private String deviceFingerprint;
    private String location;
}
