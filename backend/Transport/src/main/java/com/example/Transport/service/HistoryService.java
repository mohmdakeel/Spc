package com.example.Transport.service;

import com.example.Transport.entity.History;
import com.example.Transport.repository.HistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoryService {

    @Autowired
    private HistoryRepository historyRepository;

    // ✅ Fetch history by entity type (e.g., Driver) and entity ID (e.g., EMP001)
    public List<History> getHistoryByEntity(String entityType, String entityId) {
        return historyRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    // ✅ Get all history
    public List<History> getAllHistory() {
        return historyRepository.findAll();
    }
}
