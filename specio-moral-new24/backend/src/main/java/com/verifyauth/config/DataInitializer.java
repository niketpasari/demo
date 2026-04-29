package com.verifyauth.config;

import com.verifyauth.entity.Brand;
import com.verifyauth.entity.Product;
import com.verifyauth.entity.ScratchCode;
import com.verifyauth.repository.BrandRepository;
import com.verifyauth.repository.ProductRepository;
import com.verifyauth.repository.ScratchCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Random;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ScratchCodeRepository scratchCodeRepository;

    @Bean
    @Profile("!test")
    public CommandLineRunner initializeData() {
        return args -> {
            if (brandRepository.count() == 0) {
                /*log.info("Initializing sample data...");
                initializeSampleData();
                log.info("Sample data initialized successfully");*/
            }
        };
    }

    private void initializeSampleData() {
        // Create brands
        Brand nike = brandRepository.save(Brand.builder()
                .name("Nike")
                .description("Just Do It - World's leading athletic footwear and apparel company")
                .logoUrl("/nike-swoosh.png")
                .websiteUrl("https://www.nike.com")
                .supportEmail("support@nike.com")
                .supportPhone("+1-800-806-6453")
                .verificationBadge(true)
                .build());

        Brand adidas = brandRepository.save(Brand.builder()
                .name("Adidas")
                .description("Impossible Is Nothing - Global leader in sporting goods")
                .logoUrl("/adidas-logo.png")
                .websiteUrl("https://www.adidas.com")
                .supportEmail("support@adidas.com")
                .supportPhone("+1-800-448-1796")
                .verificationBadge(true)
                .build());

        Brand apple = brandRepository.save(Brand.builder()
                .name("Apple")
                .description("Think Different - Innovative technology company")
                .logoUrl("/apple-logo.png")
                .websiteUrl("https://www.apple.com")
                .supportEmail("support@apple.com")
                .supportPhone("+1-800-275-2273")
                .verificationBadge(true)
                .build());

        // Create products
        Product nikeAirMax = productRepository.save(Product.builder()
                .brand(nike)
                .name("Nike Air Max 270")
                .description("The Nike Air Max 270 delivers visible cushioning under every step.")
                .modelNumber("AH8050-002")
                .category("Footwear")
                .subcategory("Running Shoes")
                .imageUrl("/nike-air-max-270.png")
                .price(new BigDecimal("150.00"))
                .manufacturingDate(LocalDate.of(2024, 6, 15))
                .manufacturingLocation("Vietnam")
                .batchNumber("NKE-2024-0615-001")
                .warrantyMonths(12)
                .build());

        Product adidasUltraboost = productRepository.save(Product.builder()
                .brand(adidas)
                .name("Adidas Ultraboost 22")
                .description("Experience incredible energy return with Boost cushioning.")
                .modelNumber("GX5460")
                .category("Footwear")
                .subcategory("Running Shoes")
                .imageUrl("/adidas-ultraboost.png")
                .price(new BigDecimal("190.00"))
                .manufacturingDate(LocalDate.of(2024, 5, 20))
                .manufacturingLocation("China")
                .batchNumber("ADI-2024-0520-003")
                .warrantyMonths(12)
                .build());

        Product iPhone = productRepository.save(Product.builder()
                .brand(apple)
                .name("iPhone 15 Pro")
                .description("A magical new way to interact with iPhone.")
                .modelNumber("A3090")
                .category("Electronics")
                .subcategory("Smartphones")
                .imageUrl("/modern-smartphone.png")
                .price(new BigDecimal("999.00"))
                .manufacturingDate(LocalDate.of(2024, 8, 1))
                .manufacturingLocation("India")
                .batchNumber("APL-2024-0801-IP15")
                .warrantyMonths(24)
                .build());

        // Create scratch codes for each product
        createScratchCodesForProduct(nikeAirMax, 10);
        createScratchCodesForProduct(adidasUltraboost, 10);
        createScratchCodesForProduct(iPhone, 10);
    }

    private void createScratchCodesForProduct(Product product, int count) {
        Random random = new Random();
        for (int i = 0; i < count; i++) {
            String code = generateCode(random);
            if (!scratchCodeRepository.existsByCode(code)) {
                scratchCodeRepository.save(ScratchCode.builder()
                        .code(code)
                        .product(product)
                        .status(ScratchCode.Status.UNUSED)
                        .maxVerifications(3)
                        .build());
            }
        }
    }

    private String generateCode(Random random) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append("-");
            }
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
