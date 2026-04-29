package com.verifyauth.dto.brand;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BrandRegisterRequest {
    
    @NotBlank(message = "Brand name is required")
    private String brandName;
    
    private String description;
    
    private String websiteUrl;
    
    @Email(message = "Valid support email is required")
    private String supportEmail;
    
    private String supportPhone;
    
    @NotBlank(message = "Contact first name is required")
    private String contactFirstName;
    
    @NotBlank(message = "Contact last name is required")
    private String contactLastName;
    
    private String contactPhone;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
