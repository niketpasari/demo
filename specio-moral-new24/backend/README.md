# Product Authentication API - Spring Boot Backend

A Java Spring Boot backend for the product authentication and anti-counterfeiting system.

## Tech Stack

- **Java 17**
- **Spring Boot 3.2**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with Hibernate
- **MySQL 8.0**
- **Lombok** for reducing boilerplate
- **SpringDoc OpenAPI** for API documentation

## Prerequisites

- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+

## Getting Started

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Configure Database

Create a MySQL database:

```sql
CREATE DATABASE verify_auth_db;
```

Update `src/main/resources/application.yml` with your database credentials:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/verify_auth_db
    username: your_username
    password: your_password
```

Or set environment variables:

```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-256-bit-secret-key-here-make-it-long-enough-for-hs256
```

### 3. Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The API will be available at `http://localhost:8080/api`

### 4. Access API Documentation

Swagger UI: `http://localhost:8080/api/swagger-ui.html`

OpenAPI JSON: `http://localhost:8080/api/v3/api-docs`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/register` | Register new user |
| POST | `/v1/auth/login` | User login |
| POST | `/v1/auth/refresh` | Refresh access token |
| POST | `/v1/auth/logout` | User logout |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/verification/verify` | Verify product with scratch code |
| GET | `/v1/verification/history` | Get verification history |
| GET | `/v1/verification/recent` | Get recent verifications |
| GET | `/v1/verification/{id}` | Get verification details |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/users/me` | Get current user profile |
| PUT | `/v1/users/me` | Update user profile |
| GET | `/v1/users/me/stats` | Get user statistics |

## Project Structure

```
src/main/java/com/verifyauth/
├── ProductAuthenticationApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── OpenApiConfig.java
│   └── DataInitializer.java
├── controller/
│   ├── AuthController.java
│   ├── VerificationController.java
│   └── UserController.java
├── dto/
│   ├── auth/
│   ├── verification/
│   ├── user/
│   └── common/
├── entity/
│   ├── User.java
│   ├── Brand.java
│   ├── Product.java
│   ├── ScratchCode.java
│   └── Verification.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── NotFoundException.java
│   ├── BadRequestException.java
│   └── UnauthorizedException.java
├── repository/
│   ├── UserRepository.java
│   ├── BrandRepository.java
│   ├── ProductRepository.java
│   ├── ScratchCodeRepository.java
│   └── VerificationRepository.java
├── security/
│   ├── JwtService.java
│   └── JwtAuthenticationFilter.java
└── service/
    ├── AuthService.java
    ├── VerificationService.java
    └── UserService.java
```

## Sample Scratch Codes

After starting the application, sample data will be initialized. You can use these test codes (check the database for actual generated codes):

Format: `XXXX-XXXX-XXXX` (e.g., `ABC1-DEF2-GHI3`)

## Security Features

- **JWT Authentication**: Stateless authentication with access and refresh tokens
- **BCrypt Password Hashing**: Secure password storage
- **CORS Configuration**: Configurable cross-origin requests
- **Input Validation**: Jakarta Bean Validation for all DTOs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USERNAME` | MySQL username | root |
| `DB_PASSWORD` | MySQL password | password |
| `JWT_SECRET` | JWT signing key | (default key) |
| `SERVER_PORT` | Server port | 8080 |

## CORS Configuration

Update `application.yml` to configure allowed origins:

```yaml
cors:
  allowed-origins: http://localhost:3000,https://yourdomain.com
```

## License

MIT License
