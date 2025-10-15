package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.VehicleImage;
import com.example.Transport.history.JsonDiff;
import com.example.Transport.history.dto.CompareResult;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.example.Transport.service.VehicleImageService;
import com.example.Transport.service.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final VehicleImageService vehicleImageService;
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
                                                       @RequestBody Vehicle patch,
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(vehicleService.update(id, patch, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id,
                                                        @RequestHeader(value = "X-Actor", required = false) String actor) {
        vehicleService.softDelete(id, actor);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

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

    // ====== Images: list / upload (max 5) / delete ======

    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<java.util.List<VehicleImage>>> listImages(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vehicleImageService.list(id)));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<java.util.List<VehicleImage>>> uploadImages(
            @PathVariable Long id,
            @RequestPart("files") MultipartFile[] files,
            @RequestHeader(value = "X-Actor", required = false) String actor) {

        var result = vehicleImageService.upload(id, files, actor);
        String loc = result.isEmpty() ? null : result.get(0).getUrl();
        return (loc == null)
                ? ResponseEntity.ok(ApiResponse.success(result))
                : ResponseEntity.created(java.net.URI.create(loc)).body(ApiResponse.success(result));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        vehicleImageService.delete(id, imageId, actor);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Create vehicle + optional images in one go
    @PostMapping(value = "/with-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Vehicle>> createWithImages(
            @RequestPart("vehicle") String vehicleJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        try {
            Vehicle body = objectMapper.readValue(vehicleJson, Vehicle.class);
            Vehicle created = vehicleService.create(body, actor);
            if (files != null && files.length > 0) vehicleImageService.upload(created.getId(), files, actor);
            return ResponseEntity.ok(ApiResponse.success("Created with images", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Invalid payload: " + e.getMessage()));
        }
    }
}
