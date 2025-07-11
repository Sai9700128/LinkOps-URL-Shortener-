package com.Shortener.Repo;

import com.Shortener.Entity.UrlEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UrlRepository extends JpaRepository<UrlEntity, Long> {

    Optional<UrlEntity> findByShortCodeAndIsActiveTrue(String shortCode);

    Page<UrlEntity> findByUsernameAndIsActiveTrueOrderByCreatedAtDesc(String username, Pageable pageable);

    List<UrlEntity> findByUsernameAndIsActiveTrueOrderByClickCountDesc(String username);

    boolean existsByShortCode(String shortCode);

    @Modifying
    @Transactional
    @Query("UPDATE UrlEntity u SET u.clickCount = u.clickCount + 1 WHERE u.shortCode = :shortCode")
    void incrementClickCount(@Param("shortCode") String shortCode);

    @Query("SELECT COUNT(u) FROM UrlEntity u WHERE u.username = :username AND u.isActive = true")
    long countActiveUrlsByUsername(@Param("username") String username);

    @Query("SELECT COALESCE(SUM(u.clickCount), 0) FROM UrlEntity u WHERE u.username = :username AND u.isActive = true")
    Long getTotalClicksByUsername(@Param("username") String username);
}
