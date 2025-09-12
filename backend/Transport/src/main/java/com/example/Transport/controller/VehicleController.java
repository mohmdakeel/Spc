package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.history.JsonDiff;
import com.example.Transport.history.dto.CompareResult;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.example.Transport.service.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final ChangeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Vehicle>>> listActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.listActive(page, size, search)));
    }

    @GetMapping("/deleted")
    public ResponseEntity<ApiResponse<Page<Vehicle>>> listDeleted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.listDeleted(page, size, search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Vehicle>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.getActiveById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Vehicle>> create(@Valid @RequestBody Vehicle body,
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.create(body, actor)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Vehicle>> update(@PathVariable Long id,
                                                       @RequestBody Vehicle patch, // <-- @Valid removed
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.update(id, patch, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id,
                                                        @RequestHeader(value = "X-Actor", required = false) String actor) {
        vehicleService.softDelete(id, actor);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** NEW: restore a previously soft-deleted vehicle */
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Vehicle>> restore(@PathVariable Long id,
                                                        @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.restore(id, actor)));
    }

    @GetMapping("/{id}/compare")
    public ResponseEntity<ApiResponse<CompareResult>> compare(@PathVariable Long id) {
        var current = vehicleService.getAnyById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));

        var history = historyRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("Vehicle", String.valueOf(id))
                .stream()
                .filter(h -> "Updated".equals(h.getAction()) || "Deleted".equals(h.getAction()) || "Created".equals(h.getAction()))
                .findFirst().orElse(null);

        String prevJson = (history != null) ? history.getPreviousData() : null;
        var changes = JsonDiff.diff(objectMapper, prevJson, current);

        var result = CompareResult.builder()
                .entityType("Vehicle")
                .entityId(String.valueOf(id))
                .action(history != null ? history.getAction() : "Created")
                .comparedAgainst("latest-previous")
                .performedBy(history != null ? history.getPerformedBy() : "system")
                .timestamp(history != null ? history.getTimestamp() : current.getUpdatedAt())
                .changes(changes)
                .build();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}/with-previous")
    public ResponseEntity<ApiResponse<Object>> withPrevious(@PathVariable Long id) {
        var current = vehicleService.getAnyById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));

        var history = historyRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("Vehicle", String.valueOf(id))
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
