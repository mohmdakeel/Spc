package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.Driver;
import com.example.Transport.history.JsonDiff;
import com.example.Transport.history.dto.CompareResult;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.example.Transport.service.DriverService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;
    private final ChangeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Driver>>> listActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(driverService.listActive(page, size, search)));
    }

    @GetMapping("/deleted")
    public ResponseEntity<ApiResponse<Page<Driver>>> listDeleted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(driverService.listDeleted(page, size, search)));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Driver>> getOne(@PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getDriverById(employeeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Driver>> create(@Valid @RequestBody Driver body,
                                                      @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.create(body, actor)));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Driver>> update(@PathVariable String employeeId,
                                                      @Valid @RequestBody Driver patch,
                                                      @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.update(employeeId, patch, actor)));
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable String employeeId,
                                                        @RequestHeader(value = "X-Actor", required = false) String actor) {
        driverService.softDelete(employeeId, actor);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** NEW: restore a previously soft-deleted driver */
    @PatchMapping("/{employeeId}/restore")
    public ResponseEntity<ApiResponse<Driver>> restore(@PathVariable String employeeId,
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.restore(employeeId, actor)));
    }

    @GetMapping("/{employeeId}/compare")
    public ResponseEntity<ApiResponse<CompareResult>> compareDriver(@PathVariable String employeeId) {
        var current = driverService.getAnyDriverById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + employeeId));
        var history = historyRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("Driver", employeeId)
                .stream()
                .findFirst().orElse(null);

        String prevJson = (history != null) ? history.getPreviousData() : null;
        var changes = JsonDiff.diff(objectMapper, prevJson, current);

        var result = CompareResult.builder()
                .entityType("Driver")
                .entityId(employeeId)
                .action(history != null ? history.getAction() : "Created")
                .comparedAgainst("latest-previous")
                .performedBy(history != null ? history.getPerformedBy() : "system")
                .timestamp(history != null ? history.getTimestamp() : current.getUpdatedAt())
                .changes(changes)
                .build();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{employeeId}/with-previous")
    public ResponseEntity<ApiResponse<Object>> currentWithPrevious(@PathVariable String employeeId) {
        var current = driverService.getAnyDriverById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + employeeId));

        var history = historyRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("Driver", employeeId)
                .stream().findFirst().orElse(null);

        var payload = java.util.Map.of(
                "current", current,
                "previousJson", history != null ? history.getPreviousData() : null,
                "historyMeta", history != null ? java.util.Map.of(
                        "action", history.getAction(),
                        "performedBy", history.getPerformedBy(),
                        "timestamp", history.getTimestamp()
                ) : null
        );
        return ResponseEntity.ok(ApiResponse.success(payload));
    }
}
