package com.Auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ValidationResponse {
    private boolean valid;
    private String username;
}
