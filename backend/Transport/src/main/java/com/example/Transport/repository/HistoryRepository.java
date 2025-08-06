package com.example.Transport.repository;

import com.example.Transport.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoryRepository extends JpaRepository<History, Long> {

    // Fetch history based on entity type and entity ID
    List<History> findByEntityTypeAndEntityId(String entityType, String entityId);
}
