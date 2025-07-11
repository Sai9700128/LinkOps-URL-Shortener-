package com.Shortener.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UrlResponse {
    private Long id;
    private String originalUrl;
    private String shortCode;
    private String shortUrl;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Long clickCount;
    private Boolean isActive;
}