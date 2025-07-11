package com.Shortener.Service;

import com.Shortener.DTO.CreateUrlRequest;
import com.Shortener.DTO.UrlResponse;
import com.Shortener.DTO.UrlStatsResponse;
import com.Shortener.Entity.UrlEntity;
import com.Shortener.Exception.UrlException;
import com.Shortener.Repo.UrlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrlService {

    private final UrlRepository urlRepository;

    @Value("${app.base-url}")
    private String baseUrl;

    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHORT_CODE_LENGTH = 6;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public UrlResponse createShortUrl(CreateUrlRequest request, String username) {
        log.info("Creating short URL for user: {}", username);

        try {
            // Validate URL
            validateUrl(request.getOriginalUrl());

            // Generate or use custom short code
            String shortCode;
            if (request.getCustomAlias() != null && !request.getCustomAlias().trim().isEmpty()) {
                if (urlRepository.existsByShortCode(request.getCustomAlias())) {
                    throw new UrlException("Custom alias already exists");
                }
                shortCode = request.getCustomAlias().trim();
            } else {
                shortCode = generateShortCode();
            }

            // Create URL entity
            UrlEntity urlEntity = UrlEntity.builder()
                    .originalUrl(request.getOriginalUrl())
                    .shortCode(shortCode)
                    .username(username)
                    .createdAt(LocalDateTime.now())
                    .expiresAt(
                            request.getExpiresAt() != null ? request.getExpiresAt() : LocalDateTime.now().plusDays(365))
                    .build();

            urlEntity = urlRepository.save(urlEntity);
            log.info("Short URL created successfully: {}", shortCode);

            return mapToResponse(urlEntity);

        } catch (UrlException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating short URL: {}", e.getMessage(), e);
            throw new UrlException("Failed to create short URL: " + e.getMessage());
        }
    }

    @Transactional
    public String redirectToOriginalUrl(String shortCode) {
        log.info("Redirecting short code: {}", shortCode);

        UrlEntity urlEntity = urlRepository.findByShortCodeAndIsActiveTrue(shortCode)
                .orElseThrow(() -> new UrlException("Short URL not found or expired"));

        // Check if URL is expired
        if (urlEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Attempt to access expired URL: {}", shortCode);
            throw new UrlException("Short URL has expired");
        }

        // Increment click count
        try {
            urlRepository.incrementClickCount(shortCode);
            log.info("Click count incremented for: {}", shortCode);
        } catch (Exception e) {
            log.error("Failed to increment click count for: {}", shortCode, e);
        }

        return urlEntity.getOriginalUrl();
    }

    public Page<UrlResponse> getUserUrls(String username, Pageable pageable) {
        log.info("Fetching URLs for user: {}", username);

        Page<UrlEntity> urls = urlRepository.findByUsernameAndIsActiveTrueOrderByCreatedAtDesc(username, pageable);
        return urls.map(this::mapToResponse);
    }

    public UrlStatsResponse getUserStats(String username) {
        log.info("Fetching stats for user: {}", username);

        long totalUrls = urlRepository.countActiveUrlsByUsername(username);
        Long totalClicks = urlRepository.getTotalClicksByUsername(username);

        List<UrlEntity> topUrls = urlRepository.findByUsernameAndIsActiveTrueOrderByClickCountDesc(username)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        return UrlStatsResponse.builder()
                .totalUrls(totalUrls)
                .totalClicks(totalClicks != null ? totalClicks : 0L)
                .activeUrls(totalUrls)
                .topUrls(topUrls.stream().map(this::mapToResponse).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void deleteUrl(String shortCode, String username) {
        log.info("Deleting URL: {} for user: {}", shortCode, username);

        UrlEntity urlEntity = urlRepository.findByShortCodeAndIsActiveTrue(shortCode)
                .orElseThrow(() -> new UrlException("URL not found"));

        if (!urlEntity.getUsername().equals(username)) {
            throw new UrlException("Unauthorized to delete this URL");
        }

        urlEntity.setIsActive(false);
        urlRepository.save(urlEntity);

        log.info("URL deleted successfully: {}", shortCode);
    }

    private String generateShortCode() {
        String shortCode;
        do {
            shortCode = generateRandomString();
        } while (urlRepository.existsByShortCode(shortCode));
        return shortCode;
    }

    private String generateRandomString() {
        StringBuilder sb = new StringBuilder(SHORT_CODE_LENGTH);
        for (int i = 0; i < SHORT_CODE_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    private void validateUrl(String url) {
        try {
            URI uri = new URI(url);
            if (!uri.isAbsolute() || (!"http".equals(uri.getScheme()) && !"https".equals(uri.getScheme()))) {
                throw new UrlException("Invalid URL format. URL must start with http:// or https://");
            }
        } catch (Exception e) {
            throw new UrlException("Invalid URL: " + e.getMessage());
        }
    }

    private UrlResponse mapToResponse(UrlEntity entity) {
        return UrlResponse.builder()
                .id(entity.getId())
                .originalUrl(entity.getOriginalUrl())
                .shortCode(entity.getShortCode())
                .shortUrl(baseUrl + "/" + entity.getShortCode())
                .username(entity.getUsername())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .clickCount(entity.getClickCount())
                .isActive(entity.getIsActive())
                .build();
    }
}
