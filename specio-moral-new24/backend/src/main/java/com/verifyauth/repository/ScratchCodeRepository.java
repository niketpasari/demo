package com.verifyauth.repository;

import com.verifyauth.entity.ScratchCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScratchCodeRepository extends JpaRepository<ScratchCode, UUID> {

    Optional<ScratchCode> findByCode(String code);

    boolean existsByCode(String code);

    List<ScratchCode> findByProductId(UUID productId);

    @Query("SELECT sc FROM ScratchCode sc WHERE sc.product.id = :productId AND sc.status = 'UNUSED'")
    List<ScratchCode> findUnusedCodesByProduct(@Param("productId") UUID productId);

    @Modifying
    @Query("UPDATE ScratchCode sc SET sc.verificationCount = sc.verificationCount + 1 WHERE sc.id = :codeId")
    void incrementVerificationCount(@Param("codeId") UUID codeId);

    @Modifying
    @Query("UPDATE ScratchCode sc SET sc.status = :status WHERE sc.id = :codeId")
    void updateStatus(@Param("codeId") UUID codeId, @Param("status") ScratchCode.Status status);

    @Query("SELECT COUNT(sc) FROM ScratchCode sc WHERE sc.product.brand.id = :brandId")
    Long countByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT COUNT(sc) FROM ScratchCode sc WHERE sc.product.brand.id = :brandId AND sc.status = 'VERIFIED'")
    Long countVerifiedByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT COUNT(sc) FROM ScratchCode sc WHERE sc.product.brand.id = :brandId AND sc.status = 'UNUSED'")
    Long countUnusedByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT COUNT(sc) FROM ScratchCode sc WHERE sc.product.brand.id = :brandId AND sc.status = 'SUSPICIOUS'")
    Long countSuspiciousByBrandId(@Param("brandId") UUID brandId);

    @Query("SELECT COUNT(sc) FROM ScratchCode sc WHERE sc.product.id = :productId")
    Long countByProductId(@Param("productId") UUID productId);

    @Query(value = "SELECT sc.batch_id, COUNT(*) as quantity, MIN(sc.created_at) as created_at, p.name as product_name " +
            "FROM scratch_codes sc JOIN products p ON sc.product_id = p.id " +
            "WHERE p.brand_id = :brandId AND sc.batch_id IS NOT NULL " +
            "GROUP BY sc.batch_id, p.name " +
            "ORDER BY MIN(sc.created_at) DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findRecentBatchesByBrandId(@Param("brandId") UUID brandId);

    @Modifying
    @Query("UPDATE ScratchCode sc SET sc.hasSpecialOffer = true, " +
            "sc.specialOfferDescription = :description, " +
            "sc.specialOfferDiscountPercent = :discountPercent, " +
            "sc.specialOfferValidUntil = :validUntil " +
            "WHERE sc.batchId = :batchId")
    int enableSpecialOfferByBatch(
            @Param("batchId") String batchId,
            @Param("description") String description,
            @Param("discountPercent") Integer discountPercent,
            @Param("validUntil") java.time.LocalDateTime validUntil);

    @Modifying
    @Query("UPDATE ScratchCode sc SET sc.hasSpecialOffer = true, " +
            "sc.specialOfferDescription = :description, " +
            "sc.specialOfferDiscountPercent = :discountPercent, " +
            "sc.specialOfferValidUntil = :validUntil " +
            "WHERE sc.product.id = :productId AND sc.status = 'UNUSED'")
    int enableSpecialOfferByProduct(
            @Param("productId") UUID productId,
            @Param("description") String description,
            @Param("discountPercent") Integer discountPercent,
            @Param("validUntil") java.time.LocalDateTime validUntil);

    @Query("SELECT sc FROM ScratchCode sc WHERE sc.product.brand.id = :brandId " +
            "AND (:productId IS NULL OR sc.product.id = :productId) " +
            "AND (:batchId IS NULL OR sc.batchId = :batchId) " +
            "AND (:status IS NULL OR sc.status = :status) " +
            "ORDER BY sc.createdAt DESC")
    List<ScratchCode> findByBrandIdWithFilters(
            @Param("brandId") UUID brandId,
            @Param("productId") UUID productId,
            @Param("batchId") String batchId,
            @Param("status") ScratchCode.Status status);

    @Query("SELECT sc FROM ScratchCode sc WHERE sc.product.brand.id = :brandId " +
            "AND sc.status = 'UNUSED' " +
            "AND (sc.hasSpecialOffer IS NULL OR sc.hasSpecialOffer = false) " +
            "AND (:productId IS NULL OR sc.product.id = :productId) " +
            "AND (:batchId IS NULL OR sc.batchId = :batchId)")
    List<ScratchCode> findUnusedCodesWithoutOffer(
            @Param("brandId") UUID brandId,
            @Param("productId") UUID productId,
            @Param("batchId") String batchId);

    @Query(value = "SELECT YEAR(sc.created_at) as yr, MONTH(sc.created_at) as mn, COUNT(*) as cnt " +
            "FROM scratch_codes sc JOIN products p ON sc.product_id = p.id " +
            "WHERE p.brand_id = :brandId " +
            "GROUP BY YEAR(sc.created_at), MONTH(sc.created_at) " +
            "ORDER BY yr DESC, mn DESC", nativeQuery = true)
    List<Object[]> countByBrandIdGroupByMonth(@Param("brandId") UUID brandId);
}
