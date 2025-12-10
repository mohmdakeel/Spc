package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(
    name = "users",
    indexes = @Index(name = "idx_user_username", columnList = "username", unique = true)
)
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 64)
  private String username;

  @Column(nullable = false)
  private String password;

  private String email;

  @Column(name = "epf_no", length = 64)
  private String epfNo;

  private String fullName;
  private String department;

  @Builder.Default
  private boolean active = true;

  // 🔹 NEW: for lock/unlock logic
  @Builder.Default
  private boolean locked = false;

  private LocalDateTime addedDateTime;
}
