package com.URLShortener.Authentication.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.URLShortener.Authentication.Service.HealthCheckService;

import java.util.Map;

@RestController
public class HealthCheckerController {

    private final HealthCheckService healthCheckerService;

    @Autowired
    public HealthCheckerController(HealthCheckService healthCheckerService) {
        this.healthCheckerService = healthCheckerService;
    }

    @GetMapping("/healthz")
    public ResponseEntity<Map<String, String>> checkHealth(@RequestBody(required = false) String payload,
            @RequestParam(required = false) Map<String, String> queryParams) {
        if (payload != null && !payload.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .headers(setHeaders())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Bad request: Payload should be empty"));
        }

        if (queryParams != null && !queryParams.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .headers(setHeaders())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Bad request: Query parameters are not allowed"));
        }

        try {
            if (!healthCheckerService.isDatabaseConnected()) {
                throw new RuntimeException("Database connection unavailable");
            }
            healthCheckerService.insertHealthCheck();
            return ResponseEntity.status(HttpStatus.OK)
                    .headers(setHeaders())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("status", "UP"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .headers(setHeaders())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Database connection unavailable"));
        }
    }

    @RequestMapping(value = "/healthz", method = { RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE,
            RequestMethod.PATCH })
    public ResponseEntity<Void> rejectNonGetRequests() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    private HttpHeaders setHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.add("Pragma", "no-cache");
        headers.add("X-Content-Type-Options", "nosniff");
        headers.add("Connection", "keep-alive");
        return headers;
    }
}
