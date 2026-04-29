package com.verifyauth.repository;

import com.verifyauth.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandRepository extends JpaRepository<Brand, UUID> {

    Optional<Brand> findByName(String name);

    List<Brand> findByIsActiveTrue();

    boolean existsByName(String name);
}
