package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.dto.ServiceCandidateDtos;
import com.example.Transport.enums.ServiceCandidateStatus;
import com.example.Transport.service.ServiceCandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-candidates")
@RequiredArgsConstructor
public class ServiceCandidateController {

    private final ServiceCandidateService service;

    /** List ACTIVE by default */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ServiceCandidateDtos.Response>>> list(
            @RequestParam(required = false) ServiceCandidateStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(status, page, size)));
    }

    /** Driver adds from Driver Service Request */
    @PostMapping("/driver-add")
    public ResponseEntity<ApiResponse<ServiceCandidateDtos.Response>> addFromDriver(
            @Valid @RequestBody ServiceCandidateDtos.CreateRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.addFromDriver(body, actor)));
    }

    /** HR adds from HR Service Request / after HR approval */
    @PostMapping("/hr-add")
    public ResponseEntity<ApiResponse<ServiceCandidateDtos.Response>> addFromHR(
            @Valid @RequestBody ServiceCandidateDtos.CreateRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.addFromHR(body, actor)));
    }

    /** Trigger auto detection (odometer). interval=5000, window=200 by default. */
    @PostMapping("/auto-scan")
    public ResponseEntity<ApiResponse<List<ServiceCandidateDtos.Response>>> autoScan(
            @RequestParam(defaultValue = "5000") int intervalKm,
            @RequestParam(defaultValue = "200") int windowKm,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.autoDetectDueByOdometer(intervalKm, windowKm, actor)));
    }

    /** Update status: IN_PROGRESS or CLOSED (e.g., when PO issued or after invoice) */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ServiceCandidateDtos.Response>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ServiceCandidateDtos.UpdateStatusRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, body, actor)));
    }
}
