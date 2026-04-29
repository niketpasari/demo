package com.verifyauth.service;

import com.verifyauth.entity.Brand;
import com.verifyauth.entity.FailedVerification;
import com.verifyauth.entity.User;
import com.verifyauth.repository.BrandRepository;
import com.verifyauth.repository.FailedVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FailedVerificationService {

    private final FailedVerificationRepository failedVerificationRepository;
    private final BrandRepository brandRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedVerification(String attemptedCode, User user, String ipAddress, String userAgent, String location, String city, String state, String country) {
        try {
            FailedVerification failedVerification = FailedVerification.builder()
                    .attemptedCode(attemptedCode)
                    .user(user)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .location(location)
                    .city(city)
                    .state(state)
                    .country(country)
                    .failureReason("Invalid code - code not found in system")
                    .build();
            failedVerificationRepository.save(failedVerification);
            failedVerificationRepository.flush();
            log.info("Failed verification recorded for code: {} by user: {}", attemptedCode, user.getId());
        } catch (Exception e) {
            log.error("Error recording failed verification: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void updateFailedVerificationWithBrand(String attemptedCode, UUID userId, UUID reportedBrandId, String ipAddress, String userAgent, String location, String city, String state, String country) {
        log.info("Updating failed verification with brand info for code: {} by user: {}", attemptedCode, userId);

        Optional<FailedVerification> existingRecord = failedVerificationRepository
                .findTopByAttemptedCodeAndUserIdOrderByCreatedAtDesc(attemptedCode, userId);

        Brand reportedBrand = null;
        if (reportedBrandId != null) {
            reportedBrand = brandRepository.findById(reportedBrandId).orElse(null);
        }

        if (existingRecord.isPresent()) {
            FailedVerification failedVerification = existingRecord.get();
            failedVerification.setReportedBrand(reportedBrand);
            failedVerificationRepository.save(failedVerification);
            log.info("Updated existing failed verification with brand info");
        } else {
            log.warn("No existing failed verification found for code: {} and user: {}. Brand report not saved.", attemptedCode, userId);
        }
    }

    public long countByUserId(UUID userId) {
        return failedVerificationRepository.countByUserId(userId);
    }

    public long countByBrandId(UUID brandId) {
        return failedVerificationRepository.countFailedVerificationsByBrandId(brandId);
    }

    public List<FailedVerification> getByBrandId(UUID brandId) {
        return failedVerificationRepository.findByReportedBrandIdOrderByCreatedAtDesc(brandId);
    }
}
