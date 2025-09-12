package com.example.Transport.repository;

import com.example.Transport.entity.ChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {
    List<ChangeHistory> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
}
