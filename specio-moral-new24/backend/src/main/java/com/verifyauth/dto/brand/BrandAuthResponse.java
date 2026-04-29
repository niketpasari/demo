package com.verifyauth.dto.brand;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BrandAuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private BrandUserDto user;
    private BrandDto brand;

    @Data
    @Builder
    public static class BrandUserDto {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
    }

    @Data
    @Builder
    public static class BrandDto {
        private String id;
        private String name;
        private String description;
        private String logoUrl;
        private String websiteUrl;
        private String supportEmail;
    }
}
