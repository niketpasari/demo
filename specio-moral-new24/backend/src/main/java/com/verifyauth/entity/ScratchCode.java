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
@Table(name = "scratch_codes", indexes = {
    @Index(name = "idx_scratch_code", columnList = "code", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScratchCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.UNUSED;

    @Column(name = "verification_count")
    @Builder.Default
    private Integer verificationCount = 0;

    @Column(name = "max_verifications")
    @Builder.Default
    private Integer maxVerifications = 3;

    // Special offer fields
    @Column(name = "has_special_offer")
    @Builder.Default
    private Boolean hasSpecialOffer = false;

    @Column(name = "special_offer_description")
    private String specialOfferDescription;

    @Column(name = "special_offer_discount_percent")
    private Integer specialOfferDiscountPercent;

    @Column(name = "special_offer_valid_until")
    private LocalDateTime specialOfferValidUntil;

    // Batch tracking for code generation
    @Column(name = "batch_id")
    private String batchId;

    @Column(name = "first_verified_at")
    private LocalDateTime firstVerifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "first_verified_by")
    private User firstVerifiedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public boolean isValid() {
        return status != Status.INVALID && verificationCount < maxVerifications;
    }

    public boolean isFirstVerification() {
        return verificationCount == 0;
    }

    public enum Status {
        UNUSED,      // Never verified
        VERIFIED,    // Successfully verified at least once
        SUSPICIOUS,  // Multiple verifications from different users
        INVALID      // Marked as counterfeit or invalid
    }
}
