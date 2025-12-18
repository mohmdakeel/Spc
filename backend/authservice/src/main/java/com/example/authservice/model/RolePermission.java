// src/main/java/com/example/authservice/model/RolePermission.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "role_permission",
  uniqueConstraints = @UniqueConstraint(name = "uk_role_perm", columnNames = {"role_id","permission_id"}))
public class RolePermission {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

  @ManyToOne(optional = false) @JoinColumn(name = "role_id")
  private Role role;
  @ManyToOne(optional = false) @JoinColumn(name = "permission_id")
  private Permission permission;
}