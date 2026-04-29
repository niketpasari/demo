-- MySQL Schema for Product Authentication System
-- This file is for reference. JPA will auto-create tables with ddl-auto=update

-- CREATE DATABASE IF NOT EXISTS verifyauth_db;
USE verifyauth_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role ENUM('USER', 'ADMIN', 'BRAND_ADMIN') NOT NULL DEFAULT 'USER',
    trust_score INT DEFAULT 100,
    total_verifications INT DEFAULT 0,
    authentic_count INT DEFAULT 0,
    suspicious_count INT DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    verification_badge BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_brands_name (name)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    brand_id CHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    model_number VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    image_url VARCHAR(500),
    price DECIMAL(10, 2),
    manufacturing_date DATE,
    manufacturing_location VARCHAR(100),
    batch_number VARCHAR(100),
    warranty_months INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_category (category)
);

-- Scratch codes table
CREATE TABLE IF NOT EXISTS scratch_codes (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    product_id CHAR(36) NOT NULL,
    status ENUM('UNUSED', 'VERIFIED', 'SUSPICIOUS', 'INVALID') NOT NULL DEFAULT 'UNUSED',
    verification_count INT DEFAULT 0,
    max_verifications INT DEFAULT 3,
    first_verified_at TIMESTAMP NULL,
    first_verified_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (first_verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_scratch_code (code),
    INDEX idx_scratch_product (product_id)
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    scratch_code_id CHAR(36) NOT NULL,
    result ENUM('AUTHENTIC', 'ALREADY_VERIFIED', 'SUSPICIOUS', 'COUNTERFEIT', 'ERROR') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    device_fingerprint VARCHAR(255),
    notes TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scratch_code_id) REFERENCES scratch_codes(id) ON DELETE CASCADE,
    INDEX idx_verification_user (user_id),
    INDEX idx_verification_code (scratch_code_id),
    INDEX idx_verification_date (verified_at)
);

-- Failed verifications table (for tracking invalid code attempts with optional brand reporting)
CREATE TABLE IF NOT EXISTS failed_verifications (
    id CHAR(36) PRIMARY KEY,
    attempted_code VARCHAR(50) NOT NULL,
    user_id CHAR(36) NOT NULL,
    reported_brand_id CHAR(36) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    failure_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    INDEX idx_failed_user (user_id),
    INDEX idx_failed_brand (reported_brand_id),
    INDEX idx_failed_code (attempted_code),
    INDEX idx_failed_date (created_at)
);

-- Brand billing table (tracks monthly code generation and payment status)
CREATE TABLE IF NOT EXISTS brand_billing (
    id CHAR(36) PRIMARY KEY,
    brand_id CHAR(36) NOT NULL,
    billing_year INT NOT NULL,
    billing_month INT NOT NULL,
    codes_generated BIGINT NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP NULL,
    marked_paid_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    UNIQUE KEY uk_brand_year_month (brand_id, billing_year, billing_month),
    INDEX idx_billing_brand (brand_id),
    INDEX idx_billing_period (billing_year, billing_month)
);
