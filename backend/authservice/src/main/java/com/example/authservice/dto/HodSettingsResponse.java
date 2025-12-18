package com.example.authservice.dto;

import java.time.LocalDateTime;

public record HodSettingsResponse(
    boolean notifyEmail,
    boolean notifySms,
    boolean autoEscalate,
    boolean twoFactor,
    LocalDateTime updatedAt
) { }
