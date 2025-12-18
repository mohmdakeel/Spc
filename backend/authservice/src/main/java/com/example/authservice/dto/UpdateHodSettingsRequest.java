package com.example.authservice.dto;

import lombok.Data;

@Data
public class UpdateHodSettingsRequest {
  private boolean notifyEmail;
  private boolean notifySms;
  private boolean autoEscalate;
  private boolean twoFactor;
}
