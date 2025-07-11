package com.Shortener.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UrlStatsResponse {
    private Long totalUrls;
    private Long totalClicks;
    private Long activeUrls;
    private List<UrlResponse> topUrls;
}
