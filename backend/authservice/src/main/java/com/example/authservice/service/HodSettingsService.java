package com.example.authservice.service;

import com.example.authservice.dto.HodSettingsResponse;
import com.example.authservice.dto.UpdateHodSettingsRequest;
import com.example.authservice.model.HodSettings;
import com.example.authservice.model.User;
import com.example.authservice.repository.HodSettingsRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HodSettingsService {

  private final HodSettingsRepository settingsRepository;
  private final UserRepository userRepository;

  public HodSettingsResponse getForUser(String username) {
    return toResponse(resolveEntity(username));
  }

  @Transactional
  public HodSettingsResponse updateForUser(String username, UpdateHodSettingsRequest request) {
    HodSettings entity = resolveEntity(username);

    entity.setNotifyEmail(request.isNotifyEmail());
    entity.setNotifySms(request.isNotifySms());
    entity.setAutoEscalate(request.isAutoEscalate());
    entity.setTwoFactor(request.isTwoFactor());
    entity.setUpdatedAt(LocalDateTime.now());

    settingsRepository.save(entity);
    return toResponse(entity);
  }

  private HodSettings resolveEntity(String username) {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

    return settingsRepository.findByUser(user)
        .orElseGet(() -> settingsRepository.save(
            HodSettings.builder()
                .user(user)
                .notifyEmail(true)
                .notifySms(false)
                .autoEscalate(true)
                .twoFactor(false)
                .updatedAt(LocalDateTime.now())
                .build()
        ));
  }

  private HodSettingsResponse toResponse(HodSettings entity) {
    return new HodSettingsResponse(
        entity.isNotifyEmail(),
        entity.isNotifySms(),
        entity.isAutoEscalate(),
        entity.isTwoFactor(),
        entity.getUpdatedAt()
    );
  }
}
