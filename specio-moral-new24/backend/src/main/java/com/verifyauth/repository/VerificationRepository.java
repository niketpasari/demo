package com.verifyauth.repository;

import com.verifyauth.entity.Verification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface VerificationRepository extends JpaRepository<Verification, UUID> {

    List<Verification> findByUserId(UUID userId);

    Page<Verification> findByUserId(UUID userId, Pageable pageable);

    List<Verification> findByScratchCodeId(UUID scratchCodeId);

    @Query("SELECT v FROM Verification v WHERE v.user.id = :userId ORDER BY v.verifiedAt DESC")
    List<Verification> findRecentByUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(v) FROM Verification v WHERE v.user.id = :userId AND v.result = 'AUTHENTIC'")
    Long countAuthenticByUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(v) FROM Verification v WHERE v.user.id = :userId AND v.result IN ('SUSPICIOUS', 'COUNTERFEIT')")
    Long countSuspiciousByUser(@Param("userId") UUID userId);

    @Query("SELECT v FROM Verification v WHERE v.scratchCode.id = :codeId AND v.user.id = :userId")
    List<Verification> findByCodeAndUser(@Param("codeId") UUID codeId, @Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT v.user.id) FROM Verification v WHERE v.scratchCode.id = :codeId")
    Long countDistinctUsersByCode(@Param("codeId") UUID codeId);

    @Query("SELECT v FROM Verification v WHERE v.verifiedAt >= :since ORDER BY v.verifiedAt DESC")
    List<Verification> findRecentVerifications(@Param("since") LocalDateTime since);

    @Query("SELECT v FROM Verification v WHERE v.scratchCode.product.brand.id = :brandId ORDER BY v.verifiedAt DESC")
    List<Verification> findByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT v FROM Verification v WHERE v.scratchCode.product.brand.id = :brandId AND v.result IN :results ORDER BY v.verifiedAt DESC")
    List<Verification> findByBrandIdAndResultIn(@Param("brandId") UUID brandId, @Param("results") List<Verification.Result> results);

    @Query("SELECT v FROM Verification v WHERE v.scratchCode.id = :codeId ORDER BY v.verifiedAt DESC")
    List<Verification> findByScratchCodeIdOrderByVerifiedAtDesc(@Param("codeId") UUID codeId);
}
