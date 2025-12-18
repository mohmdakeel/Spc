// src/main/java/com/example/authservice/model/Permission.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "permission", indexes = @Index(name = "idx_permission_code", columnList = "code", unique = true))
public class Permission {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable = false, unique = true, length = 80) private String code;
  private String description;
}