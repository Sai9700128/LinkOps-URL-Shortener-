package com.URLShortener.Authentication.Database;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;

@Component
public class DatabaseHealthWatcher {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void onStart() {
        checkDatabaseHealth(true); // Immediate check at startup
    }

    @Scheduled(fixedDelay = 10000)
    public void periodicCheck() {
        checkDatabaseHealth(false);
    }

    private void checkDatabaseHealth(boolean isStartup) {
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt = conn.prepareStatement("SELECT 1")) {
            stmt.execute();
            if (isStartup) {
                System.out.println("✅ Initial database check passed.");
            }
        } catch (Exception e) {
            System.err.println("❌ Database connection failed: " + e.getMessage());
            System.exit(1); // Exit app immediately
        }
    }
}
