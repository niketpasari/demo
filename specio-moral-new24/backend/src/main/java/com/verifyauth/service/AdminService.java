package com.verifyauth.service;

import com.verifyauth.entity.*;
import com.verifyauth.exception.BadRequestException;
import com.verifyauth.exception.NotFoundException;
import com.verifyauth.repository.*;
import com.verifyauth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final VerificationRepository verificationRepository;
    private final ScratchCodeRepository scratchCodeRepository;
    private final BrandBillingRepository brandBillingRepository;
    private final FailedVerificationService failedVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    // Default admin credentials
    private static final String DEFAULT_ADMIN_EMAIL = "admin";

    public Map<String, Object> login(String username, String password) {
        // Check for admin user in DB, create if not exists
        User adminUser = userRepository.findByEmail(username).orElse(null);

        if (adminUser == null && DEFAULT_ADMIN_EMAIL.equals(username)) {
            // Create default admin user
            adminUser = User.builder()
                    .email("admin")
                    .password(passwordEncoder.encode("admin"))
                    .firstName("System")
                    .lastName("Admin")
                    .role(User.Role.ADMIN)
                    .emailVerified(true)
                    .isActive(true)
                    .build();
            adminUser = userRepository.save(adminUser);
            log.info("Default admin user created");
        }

        if (adminUser == null || adminUser.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Invalid admin credentials");
        }

        if (!passwordEncoder.matches(password, adminUser.getPassword())) {
            throw new BadRequestException("Invalid admin credentials");
        }

        String token = jwtService.generateToken(adminUser);

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken", token);
        result.put("user", Map.of(
                "id", adminUser.getId().toString(),
                "email", adminUser.getEmail(),
                "firstName", adminUser.getFirstName(),
                "lastName", adminUser.getLastName(),
                "role", adminUser.getRole().name()
        ));
        return result;
    }

    @Transactional
    public void resetPassword(String currentPassword, String newPassword, User adminUser) {
        if (!passwordEncoder.matches(currentPassword, adminUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        adminUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(adminUser);
        log.info("Admin password reset successfully");
    }

    // --- Users section ---

    public List<Map<String, Object>> getAllUsers() {
        List<User> users = userRepository.findByRole(User.Role.USER);
        return users.stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId().toString());
            map.put("email", u.getEmail());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("phone", u.getPhone());
            map.put("totalVerifications", u.getTotalVerifications());
            map.put("authenticCount", u.getAuthenticCount());
            map.put("suspiciousCount", u.getSuspiciousCount());
            map.put("trustScore", u.getTrustScore());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getUserStats(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        long failedCount = failedVerificationService.countByUserId(userId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalVerifications", user.getTotalVerifications());
        stats.put("authenticCount", user.getAuthenticCount());
        stats.put("suspiciousCount", user.getSuspiciousCount());
        stats.put("failedCount", failedCount);
        stats.put("trustScore", user.getTrustScore());
        return stats;
    }

    public List<Map<String, Object>> getUserVerificationHistory(UUID userId) {
        List<Verification> verifications = verificationRepository.findByUserId(userId);
        return verifications.stream()
                .sorted(Comparator.comparing(Verification::getVerifiedAt).reversed())
                .map(v -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", v.getId().toString());
                    map.put("code", v.getScratchCode().getCode());
                    map.put("productName", v.getScratchCode().getProduct().getName());
                    map.put("brandName", v.getScratchCode().getProduct().getBrand().getName());
                    map.put("result", v.getResult().name());
                    map.put("location", v.getLocation());
                    map.put("city", v.getCity());
                    map.put("state", v.getState());
                    map.put("country", v.getCountry());
                    map.put("verifiedAt", v.getVerifiedAt());
                    return map;
                }).collect(Collectors.toList());
    }
    
    // --- Brands section ---

    public List<Map<String, Object>> getAllBrands() {
        List<Brand> brands = brandRepository.findAll();
        return brands.stream().map(b -> {
            long totalCodes = scratchCodeRepository.countByBrandId(b.getId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId().toString());
            map.put("name", b.getName());
            map.put("description", b.getDescription());
            map.put("websiteUrl", b.getWebsiteUrl());
            map.put("supportEmail", b.getSupportEmail());
            map.put("isActive", b.getIsActive());
            map.put("totalCodes", totalCodes);
            map.put("createdAt", b.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getBrandBilling(UUID brandId) {
        // Get actual code counts from DB grouped by month
        List<Object[]> monthlyCounts = scratchCodeRepository.countByBrandIdGroupByMonth(brandId);

        // Get existing billing records
        List<BrandBilling> billingRecords = brandBillingRepository.findByBrandIdOrderByBillingYearDescBillingMonthDesc(brandId);
        Map<String, BrandBilling> billingMap = new HashMap<>();
        for (BrandBilling bb : billingRecords) {
            billingMap.put(bb.getBillingYear() + "-" + bb.getBillingMonth(), bb);
        }

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : monthlyCounts) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            String key = year + "-" + month;

            BrandBilling billing = billingMap.get(key);
            if (billing == null) {
                // Create billing record
                billing = BrandBilling.builder()
                        .brand(brand)
                        .billingYear(year)
                        .billingMonth(month)
                        .codesGenerated(count)
                        .isPaid(false)
                        .build();
                billing = brandBillingRepository.save(billing);
            } else if (!billing.getCodesGenerated().equals(count)) {
                // Update count if changed
                billing.setCodesGenerated(count);
                billing = brandBillingRepository.save(billing);
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", billing.getId().toString());
            map.put("year", year);
            map.put("month", month);
            map.put("codesGenerated", count);
            map.put("isPaid", billing.getIsPaid());
            map.put("paidAt", billing.getPaidAt());
            map.put("markedPaidBy", billing.getMarkedPaidBy());
            result.add(map);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> markBillingPaid(UUID billingId, boolean paid, User adminUser) {
        BrandBilling billing = brandBillingRepository.findById(billingId)
                .orElseThrow(() -> new NotFoundException("Billing record not found"));

        billing.setIsPaid(paid);
        if (paid) {
            billing.setPaidAt(LocalDateTime.now());
            billing.setMarkedPaidBy(adminUser.getEmail());
        } else {
            billing.setPaidAt(null);
            billing.setMarkedPaidBy(null);
        }
        brandBillingRepository.save(billing);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", billing.getId().toString());
        result.put("isPaid", billing.getIsPaid());
        result.put("paidAt", billing.getPaidAt());
        result.put("markedPaidBy", billing.getMarkedPaidBy());
        return result;
    }

    public Map<String, Object> getBrandReport(UUID brandId) {
        long totalCodes = scratchCodeRepository.countByBrandId(brandId);
        long verifiedCodes = scratchCodeRepository.countVerifiedByBrandId(brandId);
        long unusedCodes = scratchCodeRepository.countUnusedByBrandId(brandId);
        long suspiciousCodes = scratchCodeRepository.countSuspiciousByBrandId(brandId);
        long failedVerifications = failedVerificationService.countByBrandId(brandId);

        // Get verifications
        List<Verification.Result> results = Arrays.asList(
                Verification.Result.AUTHENTIC,
                Verification.Result.SUSPICIOUS
        );
        List<Verification> verifications = verificationRepository.findByBrandIdAndResultIn(brandId, results);

        List<Map<String, Object>> verificationItems = verifications.stream().map(v -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", v.getId().toString());
            map.put("code", v.getScratchCode().getCode());
            map.put("productName", v.getScratchCode().getProduct().getName());
            map.put("batchId", v.getScratchCode().getBatchId());
            map.put("status", v.getScratchCode().getStatus().name());
            map.put("result", v.getResult().name());
            map.put("verifiedAt", v.getVerifiedAt());
                    map.put("verifiedByEmail", v.getUser().getEmail());
                    map.put("location", v.getLocation());
                    map.put("city", v.getCity());
                    map.put("state", v.getState());
                    map.put("country", v.getCountry());
                    return map;
        }).collect(Collectors.toList());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalCodes", totalCodes);
        report.put("verifiedCodes", verifiedCodes);
        report.put("unusedCodes", unusedCodes);
        report.put("suspiciousCodes", suspiciousCodes);
        report.put("failedVerifications", failedVerifications);
        report.put("verifications", verificationItems);
        return report;
    }

    // --- Password Reset ---

    @Transactional
    public Map<String, Object> resetUserPassword(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != User.Role.USER) {
            throw new BadRequestException("Can only reset password for customer users");
        }

        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        emailService.sendTempPasswordEmail(user.getEmail(), user.getFirstName(), tempPassword, false);
        log.info("Password reset for user: {}", user.getEmail());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("email", user.getEmail());
        result.put("message", "Temporary password sent to " + user.getEmail());
        return result;
    }

    @Transactional
    public Map<String, Object> resetBrandPassword(UUID brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        User brandAdmin = userRepository.findByBrandIdAndRole(brandId, User.Role.BRAND_ADMIN)
                .orElseThrow(() -> new NotFoundException("Brand admin user not found for brand: " + brand.getName()));

        String tempPassword = generateTempPassword();
        brandAdmin.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(brandAdmin);

        emailService.sendTempPasswordEmail(brandAdmin.getEmail(), brandAdmin.getFirstName(), tempPassword, true);
        log.info("Password reset for brand admin: {} (brand: {})", brandAdmin.getEmail(), brand.getName());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("email", brandAdmin.getEmail());
        result.put("brandName", brand.getName());
        result.put("message", "Temporary password sent to " + brandAdmin.getEmail());
        return result;
    }

    @Transactional
    public Map<String, Object> toggleBrandActive(UUID brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        boolean newActiveState = !brand.getIsActive();
        brand.setIsActive(newActiveState);
        brandRepository.save(brand);

        // Also toggle the brand admin user's active status
        User brandAdmin = userRepository.findByBrandIdAndRole(brandId, User.Role.BRAND_ADMIN)
                .orElse(null);
        if (brandAdmin != null) {
            brandAdmin.setIsActive(newActiveState);
            userRepository.save(brandAdmin);
        }

        log.info("Brand {} (id: {}) has been {}", brand.getName(), brandId, newActiveState ? "activated" : "deactivated");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("brandId", brandId.toString());
        result.put("brandName", brand.getName());
        result.put("isActive", newActiveState);
        result.put("message", "Brand " + brand.getName() + " has been " + (newActiveState ? "activated" : "deactivated"));
        return result;
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
