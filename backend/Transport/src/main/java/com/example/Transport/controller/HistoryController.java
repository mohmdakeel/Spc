package com.example.Transport.controller;

import com.example.Transport.entity.History;
import com.example.Transport.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    // Get history by entityType (e.g., Driver) and entityId (e.g., EMP001)
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<History>> getHistory(@PathVariable String entityType,
                                                    @PathVariable String entityId) {
        List<History> history = historyService.getHistoryByEntity(entityType, entityId);
        return ResponseEntity.ok(history);
    }

    // Get all history for all entities
    @GetMapping("/all")
    public ResponseEntity<List<History>> getAllHistory() {
        List<History> allHistory = historyService.getAllHistory();
        return ResponseEntity.ok(allHistory);
    }
}
