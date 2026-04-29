package com.verifyauth.repository;

import com.verifyauth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(User.Role role);

    Optional<User> findByBrandIdAndRole(UUID brandId, User.Role role);

    Optional<User> findByVerificationToken(String verificationToken);

    @Modifying
    @Query("UPDATE User u SET u.totalVerifications = u.totalVerifications + 1 WHERE u.id = :userId")
    void incrementTotalVerifications(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE User u SET u.authenticCount = u.authenticCount + 1 WHERE u.id = :userId")
    void incrementAuthenticCount(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE User u SET u.suspiciousCount = u.suspiciousCount + 1 WHERE u.id = :userId")
    void incrementSuspiciousCount(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE User u SET u.trustScore = :score WHERE u.id = :userId")
    void updateTrustScore(@Param("userId") UUID userId, @Param("score") Integer score);
}
