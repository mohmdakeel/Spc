package com.example.Transport.repository;

import com.example.Transport.entity.ChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.List;

@Profile("db")
@Repository
public interface ChangeHistoryRepository extends JpaRepository<ChangeHistory, Long> {
    List<ChangeHistory> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
}
