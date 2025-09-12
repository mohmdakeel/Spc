package com.example.Transport.repository;

import com.example.Transport.entity.GateLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GateLogRepository extends JpaRepository<GateLog, Long> {
    Optional<GateLog> findByRequestId(Long requestId);
}
