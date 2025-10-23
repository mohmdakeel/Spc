// src/main/java/com/example/authservice/service/AuditService.java
package com.example.authservice.service;

import com.example.authservice.model.AuditLog;
import com.example.authservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service @RequiredArgsConstructor
public class AuditService {
  private final AuditLogRepository audit;

  public void log(String actor, String action, String type, String id, String details) {
    audit.save(AuditLog.builder()
      .actor(actor).action(action).entityType(type).entityId(id)
      .details(details).atTime(LocalDateTime.now()).build());
  }
}