package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.dto.DriverServiceRequestDtos;
import com.example.Transport.service.DriverServiceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver-service-requests")
@RequiredArgsConstructor
public class DriverServiceRequestController {

    private final DriverServiceRequestService service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DriverServiceRequestDtos.Response>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverServiceRequestDtos.Response>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DriverServiceRequestDtos.Response>> create(
            @Valid @RequestBody DriverServiceRequestDtos.CreateRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.create(body, actor)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DriverServiceRequestDtos.Response>> update(
            @PathVariable Long id,
            @Valid @RequestBody DriverServiceRequestDtos.UpdateRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, body, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
