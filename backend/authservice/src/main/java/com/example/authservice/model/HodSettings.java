package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
  name = "hod_settings",
  uniqueConstraints = @UniqueConstraint(columnNames = "user_id")
)
public class HodSettings {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Builder.Default
  private boolean notifyEmail = true;

  @Builder.Default
  private boolean notifySms = false;

  @Builder.Default
  private boolean autoEscalate = true;

  @Builder.Default
  private boolean twoFactor = false;

  private LocalDateTime updatedAt;
}
