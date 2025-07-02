package com.URLShortener.Authentication.Repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.URLShortener.Authentication.Entity.HealthCheck;

public interface HealthCheckRepository extends JpaRepository<HealthCheck, Long> {
}
