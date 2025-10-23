// src/main/java/com/example/authservice/repository/AuditLogRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  List<AuditLog> findAllByActorOrderByAtTimeDesc(String actor);
  List<AuditLog> findAllByOrderByAtTimeDesc();
}