package com.verifyauth.repository;

import com.verifyauth.entity.BrandBilling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandBillingRepository extends JpaRepository<BrandBilling, UUID> {

    Optional<BrandBilling> findByBrandIdAndBillingYearAndBillingMonth(UUID brandId, Integer year, Integer month);

    List<BrandBilling> findByBrandIdOrderByBillingYearDescBillingMonthDesc(UUID brandId);

    @Query("SELECT bb FROM BrandBilling bb WHERE bb.brand.id = :brandId AND bb.isPaid = false ORDER BY bb.billingYear DESC, bb.billingMonth DESC")
    List<BrandBilling> findUnpaidByBrandId(@Param("brandId") UUID brandId);
}
