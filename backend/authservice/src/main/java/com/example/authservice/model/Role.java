// src/main/java/com/example/authservice/model/Role.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "role", indexes = @Index(name = "idx_role_code", columnList = "code", unique = true))
public class Role {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable = false, unique = true, length = 64) private String code;
  private String name;
  private String description;
}