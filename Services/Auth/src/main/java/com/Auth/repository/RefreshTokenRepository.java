package com.Auth.repository;

import com.Auth.entity.RefreshToken;
import com.Auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    // Spring Data JPA method
    @Modifying
    @Transactional
    void deleteByUser_Id(Long userId);

    // Native SQL query as backup
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM refresh_tokens WHERE user_id = :userId", nativeQuery = true)
    void deleteByUserIdNative(@Param("userId") Long userId);

    // Alternative - delete by User object
    @Modifying
    @Transactional
    void deleteByUser(User user);
}