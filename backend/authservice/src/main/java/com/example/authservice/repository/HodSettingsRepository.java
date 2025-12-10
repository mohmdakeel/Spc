package com.example.authservice.repository;

import com.example.authservice.model.HodSettings;
import com.example.authservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HodSettingsRepository extends JpaRepository<HodSettings, Long> {

  Optional<HodSettings> findByUser(User user);

  Optional<HodSettings> findByUserUsernameIgnoreCase(String username);
}
