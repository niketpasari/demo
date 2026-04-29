package com.verifyauth.service;

import com.verifyauth.dto.auth.AuthResponse;
import com.verifyauth.dto.auth.LoginRequest;
import com.verifyauth.dto.auth.RegisterRequest;
import com.verifyauth.entity.User;
import com.verifyauth.exception.BadRequestException;
import com.verifyauth.exception.UnauthorizedException;
import com.verifyauth.repository.UserRepository;
import com.verifyauth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public String register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(User.Role.USER)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}, sending verification email", user.getId());

        emailService.sendVerificationEmail(user.getEmail(), verificationToken, user.getFirstName(), false);

        return "Registration successful. Please check your email to activate your account. If you don't see it in your inbox, please check your spam or junk folder.";
    }

    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired activation link"));

        if (user.getEmailVerified()) {
            return "Account is already activated. You can log in.";
        }

        if (user.getVerificationTokenExpiry() != null && user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Activation link has expired. Please register again.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        boolean isBrand = user.getRole() == User.Role.BRAND_ADMIN;
        emailService.sendActivationConfirmationEmail(user.getEmail(), user.getFirstName(), isBrand);

        log.info("Email verified for user: {}", user.getId());
        return "Account activated successfully! You can now log in.";
    }

    @Transactional
    public String resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (user.getEmailVerified()) {
            throw new BadRequestException("Account is already activated");
        }

        String newToken = UUID.randomUUID().toString();
        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        boolean isBrand = user.getRole() == User.Role.BRAND_ADMIN;
        emailService.sendVerificationEmail(user.getEmail(), newToken, user.getFirstName(), isBrand);

        return "Verification email resent. Please check your inbox.";
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            log.warn("Login failed for email: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getRole() != User.Role.USER) {
            throw new UnauthorizedException("This account is not a customer account. Please use the brand login page.");
        }

        if (!user.getEmailVerified()) {
            throw new UnauthorizedException("Please activate your account first. Check your email for the activation link. If you don't see it in your inbox, please check your spam or junk folder.");
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        log.info("Login successful for user: {}", user.getId());
        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!jwtService.isTokenValid(refreshToken, user)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .avatarUrl(user.getAvatarUrl())
                        .trustScore(user.getTrustScore())
                        .totalVerifications(user.getTotalVerifications())
                        .authenticCount(user.getAuthenticCount())
                        .suspiciousCount(user.getSuspiciousCount())
                        .build())
                .build();
    }
}
