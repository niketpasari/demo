package com.verifyauth.service;

import com.verifyauth.dto.brand.BrandListDto;
import com.verifyauth.dto.verification.ReportFailedVerificationRequest;
import com.verifyauth.dto.verification.VerificationHistoryDto;
import com.verifyauth.dto.verification.VerificationRequest;
import com.verifyauth.dto.verification.VerificationResponse;
import com.verifyauth.dto.verification.VerificationStatsDto;
import com.verifyauth.entity.Brand;
import com.verifyauth.entity.Product;
import com.verifyauth.entity.ScratchCode;
import com.verifyauth.entity.User;
import com.verifyauth.entity.Verification;
import com.verifyauth.exception.NotFoundException;
import com.verifyauth.repository.BrandRepository;
import com.verifyauth.repository.ScratchCodeRepository;
import com.verifyauth.repository.UserRepository;
import com.verifyauth.repository.VerificationRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final VerificationRepository verificationRepository;
    private final ScratchCodeRepository scratchCodeRepository;
    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final FailedVerificationService failedVerificationService;
    private final GeoCodingService geoCodingService;
    private String location;

    @Transactional
    public VerificationResponse verifyProduct(VerificationRequest request, User currentUser, HttpServletRequest httpRequest) {
        // Normalize the code - remove spaces and ensure consistent format
        String normalizedCode = normalizeCode(request.getCode());
        log.info("Verifying product with code: {} (normalized: {}) by user: {}", request.getCode(), normalizedCode, currentUser.getId());

        // Find scratch code - try both with and without dashes
        Optional<ScratchCode> scratchCodeOpt = scratchCodeRepository.findByCode(normalizedCode);
        if (scratchCodeOpt.isEmpty()) {
            scratchCodeOpt = scratchCodeRepository.findByCode(request.getCode().toUpperCase().trim());
        }
        
        location = request.getLocation();
    	String pincode,city,state,country;
        if(location != null) {
	        String[] latLong = location.split(",");
	    	String latitude = latLong[0].trim();
	    	String longitude = latLong[1].trim();
	    	
	    	Map address = geoCodingService.getAddress(Double.parseDouble(latitude), Double.parseDouble(longitude));
	    
	    	if(address == null) {
	    		pincode = location;
	    		city = null;
	    		state = null;
	    		country = null;
	    	}
	    	else {
	        	pincode = (String) address.get("postcode");
	        	city = (String) address.get("city");
	        	state = (String) address.get("state");
	        	country = (String) address.get("country");
	    	}
        }
        else {
        	pincode = null;
    		city = null;
    		state = null;
    		country = null;
        }
        
        if (scratchCodeOpt.isEmpty()) {
            // Record the failed verification attempt in a separate service/transaction
            failedVerificationService.recordFailedVerification(
                normalizedCode, 
                currentUser, 
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent"),
                pincode,
                city,
                state,
                country
            );
            
            throw new NotFoundException("Invalid verification code. Please check the code and try again.");
        }
        
        ScratchCode scratchCode = scratchCodeOpt.get();

        Product product = scratchCode.getProduct();
        Brand brand = product.getBrand();

        // Determine verification result
        Verification.Result result;
        String message;
        boolean isFirstVerification = scratchCode.isFirstVerification();

        // Check if code is marked as invalid/counterfeit
        if (scratchCode.getStatus() == ScratchCode.Status.INVALID) {
            result = Verification.Result.COUNTERFEIT;
            message = "This code has been flagged as potentially counterfeit";
        } else if (isFirstVerification) {
            // First time verification ever - product is authentic
            result = Verification.Result.AUTHENTIC;
            message = "Product verified successfully! This is the first verification.";
            
            // Update scratch code - mark as verified and record first verifier
            scratchCode.setStatus(ScratchCode.Status.VERIFIED);
            scratchCode.setFirstVerifiedAt(LocalDateTime.now());
            scratchCode.setFirstVerifiedBy(currentUser);
        } else {
            // Code has been verified before - check who verified it first
            User firstVerifier = scratchCode.getFirstVerifiedBy();
            
            if (firstVerifier != null && firstVerifier.getId().equals(currentUser.getId())) {
                // Same user who first verified is verifying again - always AUTHENTIC
                result = Verification.Result.AUTHENTIC;
                message = "Product verified successfully! This product belongs to you.";
            } else {
                // Different user trying to verify a code already used by another user
                result = Verification.Result.SUSPICIOUS;
                message = "Error: This verification code has already been used by another user. This product may be counterfeit or the code was shared.";
                scratchCode.setStatus(ScratchCode.Status.SUSPICIOUS);
            }
        }

        // Increment verification count
        scratchCode.setVerificationCount(scratchCode.getVerificationCount() + 1);
        scratchCodeRepository.save(scratchCode);

        // Create verification record
        Verification verification = Verification.builder()
                .user(currentUser)
                .scratchCode(scratchCode)
                .result(result)
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .location(pincode)
                .city(city)
        		.state(state)
        		.country(country)
                .deviceFingerprint(request.getDeviceFingerprint())
                .build();

        verification = verificationRepository.save(verification);

        // Update user statistics
        updateUserStats(currentUser, result);

        // Build response
        return buildVerificationResponse(verification, scratchCode, product, brand, message, isFirstVerification);
    }

    public List<VerificationHistoryDto> getVerificationHistory(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "verifiedAt"));
        Page<Verification> verifications = verificationRepository.findByUserId(userId, pageable);

        return verifications.getContent().stream()
                .map(this::mapToHistoryDto)
                .collect(Collectors.toList());
    }

    public List<VerificationHistoryDto> getRecentVerifications(UUID userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Verification> verifications = verificationRepository.findRecentByUser(userId, pageable);

        return verifications.stream()
                .map(this::mapToHistoryDto)
                .collect(Collectors.toList());
    }

    public VerificationResponse getVerificationDetails(UUID verificationId, UUID userId) {
        Verification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new NotFoundException("Verification not found"));

        if (!verification.getUser().getId().equals(userId)) {
            throw new NotFoundException("Verification not found");
        }

        ScratchCode scratchCode = verification.getScratchCode();
        Product product = scratchCode.getProduct();
        Brand brand = product.getBrand();

        return buildVerificationResponse(verification, scratchCode, product, brand, 
                getResultMessage(verification.getResult()), scratchCode.isFirstVerification());
    }

    private void updateUserStats(User user, Verification.Result result) {
        userRepository.incrementTotalVerifications(user.getId());

        if (result == Verification.Result.AUTHENTIC) {
            userRepository.incrementAuthenticCount(user.getId());
        } else if (result == Verification.Result.SUSPICIOUS || result == Verification.Result.COUNTERFEIT) {
            userRepository.incrementSuspiciousCount(user.getId());
            // Decrease trust score for suspicious verifications
            int newScore = Math.max(0, user.getTrustScore() - 5);
            userRepository.updateTrustScore(user.getId(), newScore);
        }
    }

    private VerificationResponse buildVerificationResponse(
            Verification verification,
            ScratchCode scratchCode,
            Product product,
            Brand brand,
            String message,
            boolean isFirstVerification
    ) {
        LocalDate warrantyExpiry = null;
        if (product.getManufacturingDate() != null && product.getWarrantyMonths() != null) {
            warrantyExpiry = product.getManufacturingDate().plusMonths(product.getWarrantyMonths());
        }

        return VerificationResponse.builder()
                .verificationId(verification.getId().toString())
                .result(verification.getResult().name())
                .message(message)
                .verifiedAt(verification.getVerifiedAt())
                .isFirstVerification(isFirstVerification)
                .verificationCount(scratchCode.getVerificationCount())
                .product(VerificationResponse.ProductInfo.builder()
                        .id(product.getId().toString())
                        .name(product.getName())
                        .description(product.getDescription())
                        .modelNumber(product.getModelNumber())
                        .category(product.getCategory())
                        .imageUrl(product.getImageUrl())
                        .price(product.getPrice())
                        .manufacturingDate(product.getManufacturingDate())
                        .manufacturingLocation(product.getManufacturingLocation())
                        .batchNumber(product.getBatchNumber())
                        .warrantyMonths(product.getWarrantyMonths())
                        .warrantyExpiry(warrantyExpiry)
                        .build())
                .brand(VerificationResponse.BrandInfo.builder()
                        .id(brand.getId().toString())
                        .name(brand.getName())
                        .description(brand.getDescription())
                        .logoUrl(brand.getLogoUrl())
                        .websiteUrl(brand.getWebsiteUrl())
                        .supportEmail(brand.getSupportEmail())
                        .supportPhone(brand.getSupportPhone())
                        .verificationBadge(brand.getVerificationBadge())
                        .build())
                .details(VerificationResponse.VerificationDetails.builder()
                        .scratchCode(scratchCode.getCode())
                        .firstVerifiedAt(scratchCode.getFirstVerifiedAt())
                        .firstVerifiedBy(scratchCode.getFirstVerifiedBy() != null ? 
                                scratchCode.getFirstVerifiedBy().getEmail() : null)
                        .totalVerifications(scratchCode.getVerificationCount())
                        .status(scratchCode.getStatus().name())
                        .build())
                .specialOffer(VerificationResponse.SpecialOfferInfo.builder()
                        .hasSpecialOffer(scratchCode.getHasSpecialOffer() != null && scratchCode.getHasSpecialOffer())
                        .description(scratchCode.getSpecialOfferDescription())
                        .discountPercent(scratchCode.getSpecialOfferDiscountPercent())
                        .validUntil(scratchCode.getSpecialOfferValidUntil())
                        .isExpired(scratchCode.getSpecialOfferValidUntil() != null && 
                                scratchCode.getSpecialOfferValidUntil().isBefore(LocalDateTime.now()))
                        .build())
                .build();
    }

    private VerificationHistoryDto mapToHistoryDto(Verification verification) {
        ScratchCode scratchCode = verification.getScratchCode();
        Product product = scratchCode.getProduct();
        Brand brand = product.getBrand();

        return VerificationHistoryDto.builder()
                .id(verification.getId().toString())
                .scratchCode(scratchCode.getCode())
                .result(verification.getResult().name())
                .verifiedAt(verification.getVerifiedAt())
                .productName(product.getName())
                .productImageUrl(product.getImageUrl())
                .brandName(brand.getName())
                .brandLogoUrl(brand.getLogoUrl())
                .category(product.getCategory())
                .build();
    }

    private String getResultMessage(Verification.Result result) {
        return switch (result) {
            case AUTHENTIC -> "Product is authentic";
            case SUSPICIOUS -> "This verification code has already been used by another user";
            case COUNTERFEIT -> "This product may be counterfeit";
            case ERROR -> "Verification error occurred";
        };
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Normalize verification code to match stored format (XXXX-XXXX-XXXX-XXXX)
     */
    private String normalizeCode(String code) {
        if (code == null || code.isEmpty()) {
            return code;
        }
        
        // Remove all non-alphanumeric characters and convert to uppercase
        String cleaned = code.toUpperCase().replaceAll("[^A-Z0-9]", "");
        
        // If the code is 16 characters (without dashes), format it with dashes
        if (cleaned.length() == 16) {
            return String.format("%s-%s-%s-%s",
                    cleaned.substring(0, 4),
                    cleaned.substring(4, 8),
                    cleaned.substring(8, 12),
                    cleaned.substring(12, 16));
        }
        
        // Otherwise return the original trimmed and uppercased
        return code.toUpperCase().trim();
    }

    public List<BrandListDto> getAllBrands() {
        return brandRepository.findByIsActiveTrue().stream()
                .map(brand -> BrandListDto.builder()
                        .id(brand.getId().toString())
                        .name(brand.getName())
                        .logoUrl(brand.getLogoUrl())
                        .build())
                .collect(Collectors.toList());
    }

    public void reportFailedVerification(ReportFailedVerificationRequest request, User currentUser, HttpServletRequest httpRequest) {
        // Normalize the code to match what was stored
        String normalizedCode = normalizeCode(request.getAttemptedCode());
        
        location = request.getLocation();
    	String pincode,city,state,country;
        if(location != null) {
	        String[] latLong = location.split(",");
	    	String latitude = latLong[0].trim();
	    	String longitude = latLong[1].trim();
	    	
	    	Map address = geoCodingService.getAddress(Double.parseDouble(latitude), Double.parseDouble(longitude));
	    
	    	if(address == null) {
	    		pincode = location;
	    		city = null;
	    		state = null;
	    		country = null;
	    	}
	    	else {
	        	pincode = (String) address.get("postcode");
	        	city = (String) address.get("city");
	        	state = (String) address.get("state");
	        	country = (String) address.get("country");
	    	}
        }
        else {
        	pincode = null;
    		city = null;
    		state = null;
    		country = null;
        }
        
        failedVerificationService.updateFailedVerificationWithBrand(
            normalizedCode,
            currentUser.getId(),
            request.getReportedBrandId(),
            getClientIp(httpRequest),
            httpRequest.getHeader("User-Agent"),
            pincode,
            city,
            state,
            country
        );
    }

    public VerificationStatsDto getVerificationStats(User currentUser) {
        long failedCount = failedVerificationService.countByUserId(currentUser.getId());
        
        return VerificationStatsDto.builder()
                .totalVerifications(currentUser.getTotalVerifications())
                .authenticCount(currentUser.getAuthenticCount())
                .suspiciousCount(currentUser.getSuspiciousCount())
                .failedCount(failedCount)
                .build();
    }
}
