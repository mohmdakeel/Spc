// src/main/java/com/example/authservice/model/AuditLog.java
package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "audit_log", indexes = {
  @Index(name = "idx_audit_actor", columnList = "actor"),
  @Index(name = "idx_audit_time", columnList = "atTime")
})
public class AuditLog {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String actor;
  private String action;
  private String entityType;
  private String entityId;
  @Column(length = 2000) private String details;
  private LocalDateTime atTime;
}