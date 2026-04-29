package com.verifyauth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "verifications", indexes = {
    @Index(name = "idx_verification_user", columnList = "user_id"),
    @Index(name = "idx_verification_code", columnList = "scratch_code_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Verification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scratch_code_id", nullable = false)
    private ScratchCode scratchCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Result result;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "location")
    private String location;
    
    @Column(name = "city")
    private String city;
    
    @Column(name = "state")
    private String state;
    
    @Column(name = "country")
    private String country;

    @Column(name = "device_fingerprint")
    private String deviceFingerprint;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "verified_at", updatable = false)
    private LocalDateTime verifiedAt;

    public enum Result {
        AUTHENTIC,           // Product is genuine (first-time or same user re-verifying)
        SUSPICIOUS,          // Code already used by a different user
        COUNTERFEIT,         // Invalid code or confirmed counterfeit
        ERROR                // Verification failed due to system error
    }
}
