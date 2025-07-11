package com.Shortener.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUrlRequest {

    @NotBlank(message = "URL cannot be empty")
    @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
    private String originalUrl;

    @Size(max = 20, message = "Custom alias cannot exceed 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9-_]*$", message = "Custom alias can only contain letters, numbers, hyphens, and underscores")
    private String customAlias;

    private LocalDateTime expiresAt;
}
