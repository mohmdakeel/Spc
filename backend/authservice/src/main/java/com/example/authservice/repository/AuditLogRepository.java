package com.example.authservice.repository;

import com.example.authservice.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AuditLogRepository 
    extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

  List<AuditLog> findAllByActorOrderByAtTimeDesc(String actor);
  List<AuditLog> findAllByOrderByAtTimeDesc();
}