// src/main/java/com/example/authservice/model/UserRole.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "user_role",
  uniqueConstraints = @UniqueConstraint(name = "uk_user_role", columnNames = {"user_id","role_id"}))
public class UserRole {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

  @ManyToOne(optional = false) @JoinColumn(name = "user_id")
  private User user;
  @ManyToOne(optional = false) @JoinColumn(name = "role_id")
  private Role role;
}