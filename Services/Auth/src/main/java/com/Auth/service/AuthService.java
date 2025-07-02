package com.Auth.service;

import com.Auth.dto.*;
import com.Auth.entity.RefreshToken;
import com.Auth.entity.User;
import com.Auth.exception.AuthException;
import com.Auth.repository.UserRepository;
import com.Auth.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        try {
            // Input validation
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                throw new AuthException("Username cannot be empty");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                throw new AuthException("Email cannot be empty");
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                throw new AuthException("Password must be at least 6 characters long");
            }

            // Check for existing users
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new AuthException("Username already exists");
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AuthException("Email already exists");
            }

            // Create and save user
            User user = User.builder()
                    .username(request.getUsername().trim())
                    .email(request.getEmail().trim().toLowerCase())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .build();

            user = userRepository.save(user);

            // Generate tokens
            String accessToken = jwtService.generateToken(user.getUsername());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .tokenType("Bearer")
                    .build();

        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            System.out.println("Registration error: " + e.getMessage());
            e.printStackTrace();
            throw new AuthException("Registration failed: " + e.getMessage());
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            // Input validation
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                throw new AuthException("Username cannot be empty");
            }
            if (request.getPassword() == null || request.getPassword().isEmpty()) {
                throw new AuthException("Password cannot be empty");
            }

            // Find user
            User user = userRepository.findByUsername(request.getUsername().trim())
                    .orElseThrow(() -> new AuthException("Invalid username or password"));

            // Check password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new AuthException("Invalid username or password");
            }

            // Generate tokens
            String accessToken = jwtService.generateToken(user.getUsername());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .tokenType("Bearer")
                    .build();

        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            System.out.println("Login error: " + e.getMessage());
            e.printStackTrace();
            throw new AuthException("Login failed: " + e.getMessage());
        }
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user.getUsername());
                    return AuthResponse.builder()
                            .accessToken(accessToken)
                            .refreshToken(request.getRefreshToken())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .tokenType("Bearer")
                            .build();
                })
                .orElseThrow(() -> new AuthException("Invalid refresh token"));
    }

    @CacheEvict(value = "user_tokens", key = "#request.username")
    public void logout(LogoutRequest request) {
        refreshTokenService.deleteByUsername(request.getUsername());
    }

    @Cacheable(value = "token_validation", key = "#token", unless = "#result.valid == false")
    public ValidationResponse validateToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            boolean isValid = jwtService.validateToken(token, username);

            return ValidationResponse.builder()
                    .valid(isValid)
                    .username(isValid ? username : null)
                    .build();
        } catch (Exception e) {
            return ValidationResponse.builder()
                    .valid(false)
                    .build();
        }
    }
}