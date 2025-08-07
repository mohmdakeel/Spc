package com.example.Transport.repository;

import com.example.Transport.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoryRepository extends JpaRepository<History, Long> {
    List<History> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<History> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
}
