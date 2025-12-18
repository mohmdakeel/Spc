// src/main/java/com/example/authservice/model/UserPermission.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(
  name = "user_permission",
  uniqueConstraints = @UniqueConstraint(name = "uk_user_perm", columnNames = {"user_id","permission_id"})
)
public class UserPermission {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

  @ManyToOne(optional = false) @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne(optional = false) @JoinColumn(name = "permission_id")
  private Permission permission;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private UserPermEffect effect; // GRANT or REVOKE
}
