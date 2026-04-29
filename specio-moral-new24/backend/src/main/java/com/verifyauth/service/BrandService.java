package com.verifyauth.service;

import com.verifyauth.dto.brand.*;
import com.verifyauth.entity.Brand;
import com.verifyauth.entity.BrandBilling;
import com.verifyauth.entity.FailedVerification;
import com.verifyauth.entity.Product;
import com.verifyauth.entity.ScratchCode;
import com.verifyauth.entity.User;
import com.verifyauth.entity.Verification;
import com.verifyauth.exception.BadRequestException;
import com.verifyauth.exception.NotFoundException;
import com.verifyauth.repository.BrandBillingRepository;
import com.verifyauth.repository.BrandRepository;
import com.verifyauth.repository.ProductRepository;
import com.verifyauth.repository.ScratchCodeRepository;
import com.verifyauth.repository.UserRepository;
import com.verifyauth.repository.VerificationRepository;
import com.verifyauth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandService {

    private final BrandRepository brandRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ScratchCodeRepository scratchCodeRepository;
    private final VerificationRepository verificationRepository;
    private final BrandBillingRepository brandBillingRepository;
    private final FailedVerificationService failedVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 16;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public String registerBrand(BrandRegisterRequest request) {
        log.info("Registering new brand: {}", request.getBrandName());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Check if brand name already exists
        if (brandRepository.existsByName(request.getBrandName())) {
            throw new BadRequestException("Brand name already exists");
        }

        String verificationToken = UUID.randomUUID().toString();

        // Create brand
        Brand brand = Brand.builder()
                .name(request.getBrandName())
                .description(request.getDescription())
                .websiteUrl(request.getWebsiteUrl())
                .supportEmail(request.getSupportEmail())
                .supportPhone(request.getSupportPhone())
                .verificationBadge(true)
                .isActive(true)
                .build();
        brand = brandRepository.save(brand);

        // Create brand admin user
        User brandAdmin = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getContactFirstName())
                .lastName(request.getContactLastName())
                .phone(request.getContactPhone())
                .role(User.Role.BRAND_ADMIN)
                .brand(brand)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();
        brandAdmin = userRepository.save(brandAdmin);

        log.info("Brand registered successfully: {}, sending verification email", brand.getId());

        emailService.sendVerificationEmail(brandAdmin.getEmail(), verificationToken, brandAdmin.getFirstName(), true);

        return "Brand registered successfully. Please check your email to activate your account. If you don't see it in your inbox, please check your spam or junk folder.";
    }

    public BrandAuthResponse loginBrand(String email, String password) {
        log.info("Brand login attempt for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (user.getRole() != User.Role.BRAND_ADMIN) {
            throw new BadRequestException("This account is not a brand account");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.getEmailVerified()) {
            throw new BadRequestException("Please activate your account first. Check your email for the activation link. If you don't see it in your inbox, please check your spam or junk folder.");
        }

        if (!user.getIsActive()) {
            throw new BadRequestException("Your account has been deactivated. Please contact support to reactivate your account.");
        }

        Brand brand = user.getBrand();
        if (brand == null || !brand.getIsActive()) {
            throw new BadRequestException("Your account has been deactivated. Please contact support to reactivate your account.");
        }

        log.info("Brand login successful for: {}", brand.getName());
        return buildBrandAuthResponse(user, brand);
    }

    @Transactional
    public CodeGenerationResponse generateCodes(UUID brandId, CodeGenerationRequest request, User currentUser) {
        log.info("Generating {} codes for brand: {}", request.getQuantity(), brandId);

        // Validate quantity is multiple of 100
        if (request.getQuantity() <= 0 || request.getQuantity() % 100 != 0) {
            throw new BadRequestException("Quantity must be a positive multiple of 100");
        }

        // Validate max quantity per request (max 10000)
        if (request.getQuantity() > 10000) {
            throw new BadRequestException("Maximum 10,000 codes can be generated per request");
        }

        // Get brand
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to generate codes for this brand");
        }

        // Get or create product
        Product product;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new NotFoundException("Product not found"));
            
            if (!product.getBrand().getId().equals(brandId)) {
                throw new BadRequestException("Product does not belong to this brand");
            }
        } else if (request.getNewProduct() != null) {
            // Create new product
            product = Product.builder()
                    .brand(brand)
                    .name(request.getNewProduct().getName())
                    .description(request.getNewProduct().getDescription())
                    .modelNumber(request.getNewProduct().getModelNumber())
                    .category(request.getNewProduct().getCategory())
                    .build();
            product = productRepository.save(product);
        } else {
            throw new BadRequestException("Either productId or newProduct must be provided");
        }

        // Generate unique batch ID
        String batchId = generateBatchId(brand.getName());

        // Generate codes
        List<ScratchCode> generatedCodes = new ArrayList<>();
        Set<String> existingCodes = new HashSet<>();
        
        for (int i = 0; i < request.getQuantity(); i++) {
            String code;
            int attempts = 0;
            do {
                code = generateUniqueCode();
                attempts++;
                if (attempts > 100) {
                    throw new BadRequestException("Failed to generate unique code. Please try again.");
                }
            } while (existingCodes.contains(code) || scratchCodeRepository.existsByCode(code));

            existingCodes.add(code);

            ScratchCode scratchCode = ScratchCode.builder()
                    .code(code)
                    .product(product)
                    .status(ScratchCode.Status.UNUSED)
                    .batchId(batchId)
                    .hasSpecialOffer(request.getHasSpecialOffer() != null && request.getHasSpecialOffer())
                    .specialOfferDescription(request.getSpecialOfferDescription())
                    .specialOfferDiscountPercent(request.getSpecialOfferDiscountPercent())
                    .specialOfferValidUntil(request.getSpecialOfferValidUntil())
                    .build();

            generatedCodes.add(scratchCode);
        }

        // Batch save all codes
        scratchCodeRepository.saveAll(generatedCodes);

        log.info("Generated {} codes for brand {} with batch ID: {}", generatedCodes.size(), brand.getName(), batchId);

        // Build response
        List<String> codes = generatedCodes.stream()
                .map(ScratchCode::getCode)
                .collect(Collectors.toList());

        return CodeGenerationResponse.builder()
                .batchId(batchId)
                .quantity(generatedCodes.size())
                .productId(product.getId().toString())
                .productName(product.getName())
                .codes(codes)
                .hasSpecialOffer(request.getHasSpecialOffer() != null && request.getHasSpecialOffer())
                .specialOfferDescription(request.getSpecialOfferDescription())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    public BrandDashboardResponse getDashboard(UUID brandId, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand dashboard");
        }

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        // Get products for this brand
        List<Product> products = productRepository.findByBrandId(brandId);
        
        // Calculate statistics
        long totalCodes = scratchCodeRepository.countByBrandId(brandId);
        long verifiedCodes = scratchCodeRepository.countVerifiedByBrandId(brandId);
        long unusedCodes = scratchCodeRepository.countUnusedByBrandId(brandId);
        long suspiciousCodes = scratchCodeRepository.countSuspiciousByBrandId(brandId);
        long failedVerifications = failedVerificationService.countByBrandId(brandId);

        // Get recent batches
        List<BatchSummary> recentBatches = scratchCodeRepository.findRecentBatchesByBrandId(brandId)
                .stream()
                .map(batch -> {
                    LocalDateTime createdAt;
                    Object dateObj = batch[2];
                    if (dateObj instanceof java.sql.Timestamp) {
                        createdAt = ((java.sql.Timestamp) dateObj).toLocalDateTime();
                    } else if (dateObj instanceof LocalDateTime) {
                        createdAt = (LocalDateTime) dateObj;
                    } else {
                        createdAt = LocalDateTime.now();
                    }
                    return BatchSummary.builder()
                            .batchId((String) batch[0])
                            .quantity(((Number) batch[1]).intValue())
                            .createdAt(createdAt)
                            .productName((String) batch[3])
                            .build();
                })
                .collect(Collectors.toList());

        // Map products
        List<ProductSummary> productSummaries = products.stream()
                .map(p -> ProductSummary.builder()
                        .id(p.getId().toString())
                        .name(p.getName())
                        .category(p.getCategory())
                        .totalCodes(scratchCodeRepository.countByProductId(p.getId()))
                        .build())
                .collect(Collectors.toList());

        return BrandDashboardResponse.builder()
                .brandId(brand.getId().toString())
                .brandName(brand.getName())
                .totalCodes(totalCodes)
                .verifiedCodes(verifiedCodes)
                .unusedCodes(unusedCodes)
                .suspiciousCodes(suspiciousCodes)
                .failedVerifications(failedVerifications)
                .totalProducts(products.size())
                .products(productSummaries)
                .recentBatches(recentBatches)
                .build();
    }

    @Transactional
    public void enableSpecialOffer(UUID brandId, SpecialOfferRequest request, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to modify this brand's codes");
        }

        // Update codes with special offer
        int updatedCount;
        if (request.getBatchId() != null) {
            updatedCount = scratchCodeRepository.enableSpecialOfferByBatch(
                    request.getBatchId(),
                    request.getDescription(),
                    request.getDiscountPercent(),
                    request.getValidUntil()
            );
        } else if (request.getProductId() != null) {
            updatedCount = scratchCodeRepository.enableSpecialOfferByProduct(
                    UUID.fromString(request.getProductId()),
                    request.getDescription(),
                    request.getDiscountPercent(),
                    request.getValidUntil()
            );
        } else {
            throw new BadRequestException("Either batchId or productId must be provided");
        }

        log.info("Enabled special offer for {} codes", updatedCount);
    }

    public List<ProductSummary> getProducts(UUID brandId, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand's products");
        }

        List<Product> products = productRepository.findByBrandId(brandId);
        
        return products.stream()
                .map(p -> ProductSummary.builder()
                        .id(p.getId().toString())
                        .name(p.getName())
                        .description(p.getDescription())
                        .modelNumber(p.getModelNumber())
                        .category(p.getCategory())
                        .imageUrl(p.getImageUrl())
                        .totalCodes(scratchCodeRepository.countByProductId(p.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductSummary createProduct(UUID brandId, CreateProductRequest request, User currentUser) {
        log.info("Creating new product for brand: {}", brandId);

        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to create products for this brand");
        }

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Brand not found"));

        // Check if product with same name already exists for this brand
        List<Product> existingProducts = productRepository.findByBrandId(brandId);
        boolean nameExists = existingProducts.stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(request.getName()));
        if (nameExists) {
            throw new BadRequestException("A product with this name already exists");
        }

        Product product = Product.builder()
                .brand(brand)
                .name(request.getName())
                .description(request.getDescription())
                .modelNumber(request.getModelNumber())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .build();
        product = productRepository.save(product);

        log.info("Product created successfully: {}", product.getId());

        return ProductSummary.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .description(product.getDescription())
                .modelNumber(product.getModelNumber())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .totalCodes(0L)
                .build();
    }

    public CodeListResponse getCodes(UUID brandId, String productId, String batchId, String status, 
                                      int page, int size, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand's codes");
        }

        // Get codes with filters
        List<ScratchCode> allCodes = scratchCodeRepository.findByBrandIdWithFilters(
                brandId,
                productId != null ? UUID.fromString(productId) : null,
                batchId,
                status != null ? ScratchCode.Status.valueOf(status) : null
        );

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, allCodes.size());
        List<ScratchCode> pagedCodes = start < allCodes.size() ? allCodes.subList(start, end) : List.of();

        List<CodeListResponse.CodeItem> codeItems = pagedCodes.stream()
                .map(sc -> CodeListResponse.CodeItem.builder()
                        .id(sc.getId().toString())
                        .code(sc.getCode())
                        .productId(sc.getProduct().getId().toString())
                        .productName(sc.getProduct().getName())
                        .batchId(sc.getBatchId())
                        .status(sc.getStatus().name())
                        .hasSpecialOffer(sc.getHasSpecialOffer() != null && sc.getHasSpecialOffer())
                        .specialOfferDescription(sc.getSpecialOfferDescription())
                        .specialOfferDiscountPercent(sc.getSpecialOfferDiscountPercent())
                        .createdAt(sc.getCreatedAt())
                        .verifiedAt(sc.getFirstVerifiedAt())
                        .build())
                .collect(Collectors.toList());

        return CodeListResponse.builder()
                .codes(codeItems)
                .page(page)
                .size(size)
                .totalElements(allCodes.size())
                .totalPages((int) Math.ceil((double) allCodes.size() / size))
                .build();
    }

    @Transactional
    public SpecialOfferResponse enableSpecialOfferForCodes(UUID brandId, SpecialOfferCodesRequest request, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to modify this brand's codes");
        }

        List<ScratchCode> codesToUpdate;

        if ("individual".equals(request.getSelectionMode())) {
            // Individual selection
            if (request.getCodeIds() == null || request.getCodeIds().isEmpty()) {
                throw new BadRequestException("Code IDs are required for individual selection");
            }

            List<UUID> codeUuids = request.getCodeIds().stream()
                    .map(UUID::fromString)
                    .collect(Collectors.toList());

            codesToUpdate = scratchCodeRepository.findAllById(codeUuids);

            // Verify all codes belong to this brand
            for (ScratchCode code : codesToUpdate) {
                if (!code.getProduct().getBrand().getId().equals(brandId)) {
                    throw new BadRequestException("Code " + code.getCode() + " does not belong to this brand");
                }
            }

        } else if ("random".equals(request.getSelectionMode())) {
            // Random selection
            if (request.getRandomCount() == null || request.getRandomCount() <= 0) {
                throw new BadRequestException("Random count must be a positive number");
            }

            // Get unused codes without special offers for random selection
            List<ScratchCode> availableCodes = scratchCodeRepository.findUnusedCodesWithoutOffer(
                    brandId,
                    request.getProductId() != null ? UUID.fromString(request.getProductId()) : null,
                    request.getBatchId()
            );

            if (availableCodes.size() < request.getRandomCount()) {
                throw new BadRequestException("Not enough available codes. Found: " + availableCodes.size() + ", requested: " + request.getRandomCount());
            }

            // Shuffle and take random selection
            Collections.shuffle(availableCodes, SECURE_RANDOM);
            codesToUpdate = availableCodes.subList(0, request.getRandomCount());

        } else {
            throw new BadRequestException("Selection mode must be 'individual' or 'random'");
        }

        // Update codes with special offer
        for (ScratchCode code : codesToUpdate) {
            code.setHasSpecialOffer(true);
            code.setSpecialOfferDescription(request.getDescription());
            code.setSpecialOfferDiscountPercent(request.getDiscountPercent());
            code.setSpecialOfferValidUntil(request.getValidUntil());
        }

        scratchCodeRepository.saveAll(codesToUpdate);

        List<String> updatedCodeStrings = codesToUpdate.stream()
                .map(ScratchCode::getCode)
                .collect(Collectors.toList());

        log.info("Enabled special offer for {} codes for brand {}", codesToUpdate.size(), brandId);

        return SpecialOfferResponse.builder()
                .updatedCount(codesToUpdate.size())
                .updatedCodes(updatedCodeStrings)
                .description(request.getDescription())
                .discountPercent(request.getDiscountPercent())
                .build();
    }

    private String generateUniqueCode() {
        StringBuilder code = new StringBuilder();
        
        // Format: XXXX-XXXX-XXXX-XXXX (16 characters in 4 groups)
        for (int i = 0; i < CODE_LENGTH; i++) {
            if (i > 0 && i % 4 == 0) {
                code.append("-");
            }
            int index = SECURE_RANDOM.nextInt(CODE_CHARACTERS.length());
            code.append(CODE_CHARACTERS.charAt(index));
        }
        
        return code.toString();
    }

    private String generateBatchId(String brandName) {
        String prefix = brandName.replaceAll("[^A-Za-z]", "").toUpperCase();
        if (prefix.length() > 4) {
            prefix = prefix.substring(0, 4);
        }
        String timestamp = String.valueOf(System.currentTimeMillis() % 1000000);
        String random = String.format("%04d", SECURE_RANDOM.nextInt(10000));
        return prefix + "-" + timestamp + "-" + random;
    }

    private BrandAuthResponse buildBrandAuthResponse(User user, Brand brand) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return BrandAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(BrandAuthResponse.BrandUserDto.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .build())
                .brand(BrandAuthResponse.BrandDto.builder()
                        .id(brand.getId().toString())
                        .name(brand.getName())
                        .description(brand.getDescription())
                        .logoUrl(brand.getLogoUrl())
                        .websiteUrl(brand.getWebsiteUrl())
                        .supportEmail(brand.getSupportEmail())
                        .build())
                .build();
    }

    public VerificationReportResponse getVerificationReport(UUID brandId, String statusFilter, String locationFilter, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand's report");
        }

        // Get statistics
        long totalCodes = scratchCodeRepository.countByBrandId(brandId);
        long verifiedCodes = scratchCodeRepository.countVerifiedByBrandId(brandId);
        long unusedCodes = scratchCodeRepository.countUnusedByBrandId(brandId);
        long suspiciousCodes = scratchCodeRepository.countSuspiciousByBrandId(brandId);
        long failedVerifications = failedVerificationService.countByBrandId(brandId);

        // Get verifications for verified, suspicious statuses
        List<Verification.Result> results = Arrays.asList(
            Verification.Result.AUTHENTIC, 
            Verification.Result.SUSPICIOUS
        );
        List<Verification> verifications = verificationRepository.findByBrandIdAndResultIn(brandId, results);

        // Apply filters and convert to DTOs
        List<VerificationReportResponse.VerificationItem> verificationItems = verifications.stream()
            .filter(v -> {
                if (statusFilter != null && !statusFilter.isEmpty() && !statusFilter.equals("all")) {
                    return v.getResult().name().equalsIgnoreCase(statusFilter);
                }
                return true;
            })
  .filter(v -> {
  if (locationFilter != null && !locationFilter.isEmpty() && !locationFilter.equals("all")) {
  String lf = locationFilter.toLowerCase();
  return (v.getLocation() != null && v.getLocation().toLowerCase().contains(lf))
      || (v.getCity() != null && v.getCity().toLowerCase().contains(lf))
      || (v.getState() != null && v.getState().toLowerCase().contains(lf))
      || (v.getCountry() != null && v.getCountry().toLowerCase().contains(lf));
  }
  return true;
  })
  .map(v -> VerificationReportResponse.VerificationItem.builder()
                .id(v.getId().toString())
                .code(v.getScratchCode().getCode())
                .productId(v.getScratchCode().getProduct().getId().toString())
                .productName(v.getScratchCode().getProduct().getName())
                .batchId(v.getScratchCode().getBatchId())
                .status(v.getScratchCode().getStatus().name())
                .result(v.getResult().name())
                .hasSpecialOffer(v.getScratchCode().getHasSpecialOffer() != null && v.getScratchCode().getHasSpecialOffer())
                .specialOfferDescription(v.getScratchCode().getSpecialOfferDescription())
                .verifiedAt(v.getVerifiedAt())
.verifiedByEmail(v.getUser().getEmail())
.location(v.getLocation())
.city(v.getCity())
.state(v.getState())
.country(v.getCountry())
.build())
.collect(Collectors.toList());
  
  // Get failed verifications for this brand
        List<FailedVerification> failedList = failedVerificationService.getByBrandId(brandId);
        List<VerificationReportResponse.FailedVerificationItem> failedItems = failedList.stream()
  .filter(f -> {
  if (locationFilter != null && !locationFilter.isEmpty() && !locationFilter.equals("all")) {
  String lf = locationFilter.toLowerCase();
  return (f.getLocation() != null && f.getLocation().toLowerCase().contains(lf))
      || (f.getCity() != null && f.getCity().toLowerCase().contains(lf))
      || (f.getState() != null && f.getState().toLowerCase().contains(lf))
      || (f.getCountry() != null && f.getCountry().toLowerCase().contains(lf));
  }
  return true;
  })
  .map(f -> VerificationReportResponse.FailedVerificationItem.builder()
                .id(f.getId().toString())
                .attemptedCode(f.getAttemptedCode())
                .userEmail(f.getUser().getEmail())
.createdAt(f.getCreatedAt())
.location(f.getLocation())
.city(f.getCity())
.state(f.getState())
.country(f.getCountry())
.failureReason(f.getFailureReason())
                .build())
            .collect(Collectors.toList());

        return VerificationReportResponse.builder()
            .totalCodes(totalCodes)
            .verifiedCodes(verifiedCodes)
            .unusedCodes(unusedCodes)
            .suspiciousCodes(suspiciousCodes)
            .failedVerifications(failedVerifications)
            .verifications(verificationItems)
            .failedItems(failedItems)
            .build();
    }

    public CodeDetailsResponse getCodeDetails(UUID brandId, String code, User currentUser) {
        // Verify user belongs to this brand
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand's codes");
        }

        // Find the scratch code
        ScratchCode scratchCode = scratchCodeRepository.findByCode(code.toUpperCase().trim())
            .orElseThrow(() -> new NotFoundException("Code not found"));

        // Verify the code belongs to this brand
        if (!scratchCode.getProduct().getBrand().getId().equals(brandId)) {
            throw new BadRequestException("Code does not belong to this brand");
        }

        // Get verification history
        List<Verification> verifications = verificationRepository.findByScratchCodeIdOrderByVerifiedAtDesc(scratchCode.getId());
        List<CodeDetailsResponse.VerificationHistoryItem> history = verifications.stream()
            .map(v -> CodeDetailsResponse.VerificationHistoryItem.builder()
                .id(v.getId().toString())
                .result(v.getResult().name())
                .verifiedAt(v.getVerifiedAt())
.verifiedByEmail(v.getUser().getEmail())
.location(v.getLocation())
.city(v.getCity())
.state(v.getState())
.country(v.getCountry())
.ipAddress(v.getIpAddress())
                .build())
            .collect(Collectors.toList());

        return CodeDetailsResponse.builder()
            .id(scratchCode.getId().toString())
            .code(scratchCode.getCode())
            .productId(scratchCode.getProduct().getId().toString())
            .productName(scratchCode.getProduct().getName())
            .batchId(scratchCode.getBatchId())
            .status(scratchCode.getStatus().name())
            .hasSpecialOffer(scratchCode.getHasSpecialOffer() != null && scratchCode.getHasSpecialOffer())
            .specialOfferDescription(scratchCode.getSpecialOfferDescription())
            .specialOfferDiscountPercent(scratchCode.getSpecialOfferDiscountPercent())
            .specialOfferValidUntil(scratchCode.getSpecialOfferValidUntil())
            .createdAt(scratchCode.getCreatedAt())
            .firstVerifiedAt(scratchCode.getFirstVerifiedAt())
            .firstVerifiedByEmail(scratchCode.getFirstVerifiedBy() != null ? scratchCode.getFirstVerifiedBy().getEmail() : null)
            .verificationCount(scratchCode.getVerificationCount())
            .verificationHistory(history)
            .build();
    }

    public List<Map<String, Object>> getBrandBillingForPortal(UUID brandId, User currentUser) {
        if (!currentUser.getBrand().getId().equals(brandId)) {
            throw new BadRequestException("You don't have permission to access this brand's billing");
        }

        List<Object[]> monthlyCounts = scratchCodeRepository.countByBrandIdGroupByMonth(brandId);
        List<BrandBilling> billingRecords = brandBillingRepository.findByBrandIdOrderByBillingYearDescBillingMonthDesc(brandId);
        Map<String, BrandBilling> billingMap = new HashMap<>();
        for (BrandBilling bb : billingRecords) {
            billingMap.put(bb.getBillingYear() + "-" + bb.getBillingMonth(), bb);
        }

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : monthlyCounts) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            String key = year + "-" + month;

            BrandBilling billing = billingMap.get(key);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("year", year);
            map.put("month", month);
            map.put("codesGenerated", count);
            map.put("isPaid", billing != null ? billing.getIsPaid() : false);
            map.put("paidAt", billing != null ? billing.getPaidAt() : null);
            result.add(map);
        }

        return result;
    }

    public void resetPassword(User currentUser, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, currentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters");
        }
        currentUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(currentUser);
    }
}
