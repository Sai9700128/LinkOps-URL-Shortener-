package com.Auth.service;

import com.Auth.entity.RefreshToken;
import com.Auth.entity.User;
import com.Auth.exception.AuthException;
import com.Auth.repository.RefreshTokenRepository;
import com.Auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.jwtRefreshExpirationMs:86400000}") // 24 hours default
    private Long refreshTokenDurationMs;

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AuthException("User not found"));

            // First, delete any existing refresh tokens for this user
            System.out.println("Deleting existing refresh tokens for user: " + userId);
            refreshTokenRepository.deleteByUserIdNative(userId);

            // Force flush to ensure deletion is committed before insertion
            refreshTokenRepository.flush();

            System.out.println("Creating new refresh token for user: " + userId);
            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token(UUID.randomUUID().toString())
                    .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                    .build();

            RefreshToken savedToken = refreshTokenRepository.save(refreshToken);
            System.out.println("Successfully created refresh token: " + savedToken.getToken());

            return savedToken;

        } catch (Exception e) {
            System.out.println("Error creating refresh token: " + e.getMessage());
            e.printStackTrace();
            throw new AuthException("Failed to create refresh token: " + e.getMessage());
        }
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new AuthException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    @Transactional
    public void deleteByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthException("User not found"));
        refreshTokenRepository.deleteByUser_Id(user.getId());
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }
}