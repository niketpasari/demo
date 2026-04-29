package com.verifyauth.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private Integer trustScore;
    private Integer totalVerifications;
    private Integer authenticCount;
    private Integer suspiciousCount;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
}
