package com.verifyauth.repository;

import com.verifyauth.entity.FailedVerification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FailedVerificationRepository extends JpaRepository<FailedVerification, UUID> {

    Page<FailedVerification> findByUserId(UUID userId, Pageable pageable);

    Page<FailedVerification> findByReportedBrandId(UUID brandId, Pageable pageable);

    long countByReportedBrandId(UUID brandId);

    long countByUserId(UUID userId);

    Optional<FailedVerification> findTopByAttemptedCodeAndUserIdOrderByCreatedAtDesc(String attemptedCode, UUID userId);

    @Query("SELECT COUNT(f) FROM FailedVerification f WHERE f.reportedBrand.id = :brandId")
    long countFailedVerificationsByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT f FROM FailedVerification f WHERE f.reportedBrand.id = :brandId ORDER BY f.createdAt DESC")
    List<FailedVerification> findRecentByBrandId(@Param("brandId") UUID brandId, Pageable pageable);

    List<FailedVerification> findByReportedBrandIdOrderByCreatedAtDesc(UUID reportedBrandId);
}
