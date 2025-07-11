package com.Shortener.Controller;

import com.Shortener.DTO.CreateUrlRequest;
import com.Shortener.DTO.UrlResponse;
import com.Shortener.DTO.UrlStatsResponse;
import com.Shortener.JWT.JwtUtil;
import com.Shortener.Service.UrlService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class UrlController {

    private final UrlService urlService;
    private final JwtUtil jwtUtil;

    @PostMapping("/api/urls")
    public ResponseEntity<UrlResponse> createShortUrl(
            @Valid @RequestBody CreateUrlRequest request,
            @RequestHeader("Authorization") String authHeader) {

        log.info("Creating short URL for: {}", request.getOriginalUrl());

        String username = extractUsernameFromToken(authHeader);
        UrlResponse response = urlService.createShortUrl(request, username);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{shortCode}")
    public void redirectToUrl(@PathVariable String shortCode, HttpServletResponse response) throws IOException {
        log.info("Redirect request for short code: {}", shortCode);

        try {
            String originalUrl = urlService.redirectToOriginalUrl(shortCode);
            response.sendRedirect(originalUrl);
        } catch (Exception e) {
            log.error("Error redirecting for short code {}: {}", shortCode, e.getMessage());
            response.sendError(HttpStatus.NOT_FOUND.value(), "URL not found or expired");
        }
    }

    @GetMapping("/api/urls")
    public ResponseEntity<Page<UrlResponse>> getUserUrls(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = extractUsernameFromToken(authHeader);
        log.info("Fetching URLs for user: {} (page: {}, size: {})", username, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<UrlResponse> urls = urlService.getUserUrls(username, pageable);

        return ResponseEntity.ok(urls);
    }

    @GetMapping("/api/stats")
    public ResponseEntity<UrlStatsResponse> getUserStats(@RequestHeader("Authorization") String authHeader) {
        String username = extractUsernameFromToken(authHeader);
        log.info("Fetching stats for user: {}", username);

        UrlStatsResponse stats = urlService.getUserStats(username);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/api/urls/{shortCode}")
    public ResponseEntity<Void> deleteUrl(
            @PathVariable String shortCode,
            @RequestHeader("Authorization") String authHeader) {

        String username = extractUsernameFromToken(authHeader);
        log.info("Deleting URL {} for user: {}", shortCode, username);

        urlService.deleteUrl(shortCode, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("URL Shortener Service is running");
    }

    private String extractUsernameFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Invalid or expired token");
        }

        return jwtUtil.extractUsername(token);
    }
}
