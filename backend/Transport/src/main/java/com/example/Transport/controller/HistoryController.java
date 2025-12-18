// backend/src/main/java/com/example/Transport/controller/HistoryController.java
package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.history.dto.CompareResult;
import com.example.Transport.history.dto.HistoryRecordDto;
import com.example.Transport.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    // NEW: recent list across all entities (for History page)
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<HistoryRecordDto>>> recent(@RequestParam(defaultValue = "200") int size) {
        return ResponseEntity.ok(ApiResponse.success(historyService.recent(size)));
    }

    // Timeline for an entity
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<List<HistoryRecordDto>>> timeline(@PathVariable String entityType,
                                                                        @PathVariable String entityId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.timeline(entityType, entityId)));
    }

    // Compare a single history record (previous vs new)
    @GetMapping("/compare/{historyId}")
    public ResponseEntity<ApiResponse<CompareResult>> compareHistory(@PathVariable Long historyId) {
        return ResponseEntity.ok(ApiResponse.success(historyService.compareHistoryRecord(historyId)));
    }
}
