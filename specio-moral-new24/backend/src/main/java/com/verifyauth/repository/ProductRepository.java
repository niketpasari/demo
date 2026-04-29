package com.verifyauth.repository;

import com.verifyauth.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByBrandId(UUID brandId);

    Page<Product> findByBrandId(UUID brandId, Pageable pageable);

    List<Product> findByCategory(String category);

    @Query("SELECT p FROM Product p WHERE p.brand.id = :brandId AND p.isActive = true")
    List<Product> findActiveProductsByBrand(@Param("brandId") UUID brandId);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.isActive = true")
    List<String> findAllCategories();
}
