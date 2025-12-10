package com.example.authservice.repository;

import com.example.authservice.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

  // get the newest unused token for this username
  Optional<PasswordResetToken> findTopByUser_UsernameAndUsedFalseOrderByExpiryDateDesc(String username);

  // mark all existing tokens for that user as used
  @Modifying
  @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user.id = :userId AND t.used = false")
  void markUsedByUserId(Long userId);
}
