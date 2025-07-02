package com.URLShortener.Authentication.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.URLShortener.Authentication.TableNotFoundException;
import com.URLShortener.Authentication.Entity.HealthCheck;
import com.URLShortener.Authentication.Repo.HealthCheckRepository;

@Service
public class HealthCheckService {

    private final String HEALTH_CHECK_TABLE = "health_check";

    @Autowired
    private HealthCheckRepository healthCheckRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public boolean isDatabaseConnected() throws TableNotFoundException {
        try {
            if (!tableExists(HEALTH_CHECK_TABLE)) {
                throw new TableNotFoundException("Table '" + HEALTH_CHECK_TABLE + "' not found in database.");
            }

            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (TableNotFoundException e) {
            throw e;
        } catch (DataAccessException e) {
            return false;
        }
    }

    private boolean tableExists(String tableName) {
        try {
            jdbcTemplate.execute("SELECT 1 FROM " + tableName + " LIMIT 1");
            return true;
        } catch (DataAccessException e) {
            return false;
        }
    }

    public boolean logHealthCheck() {
        try {
            HealthCheck healthCheck = new HealthCheck();
            healthCheckRepository.save(healthCheck);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void insertHealthCheck() {
        logHealthCheck();
    }
}
