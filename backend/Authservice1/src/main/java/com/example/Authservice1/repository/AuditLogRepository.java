package com.example.Authservice1.repository;
import com.example.Authservice1.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}
