package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.dto.DriverServiceRequestDtos;
import com.example.Transport.enums.HrApprovalStatus;
import com.example.Transport.repository.DriverServiceRequestRepository;
import com.example.Transport.service.DriverServiceRequestService;
import com.example.Transport.service.ServiceRequisiteService;
import com.example.Transport.dto.ServiceRequisiteDtos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver-service-requests")
@RequiredArgsConstructor
public class DriverServiceRequestController {

    private final DriverServiceRequestService service;

    private final ServiceRequisiteService serviceRequisiteService;
    private final DriverServiceRequestRepository dsrRepo;
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

    /* ===== NEW: Query helpers ===== */

    @GetMapping("/by-epf/{epf}")
    public ResponseEntity<ApiResponse<List<DriverServiceRequestDtos.Response>>> getByEpf(@PathVariable String epf) {
        return ResponseEntity.ok(ApiResponse.success(service.getByEpf(epf)));
    }

    @GetMapping("/by-vehicle/{vehicleNumber}")
    public ResponseEntity<ApiResponse<List<DriverServiceRequestDtos.Response>>> getByVehicle(@PathVariable String vehicleNumber) {
        return ResponseEntity.ok(ApiResponse.success(service.getByVehicleNumber(vehicleNumber)));
    }

    @GetMapping("/by-epf-and-vehicle")
    public ResponseEntity<ApiResponse<List<DriverServiceRequestDtos.Response>>> getByEpfAndVehicle(
            @RequestParam String epf,
            @RequestParam String vehicleNumber) {
        return ResponseEntity.ok(ApiResponse.success(service.getByEpfAndVehicleNumber(epf, vehicleNumber)));
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

    @PatchMapping("/{id}/hr-approve")
    public ResponseEntity<ApiResponse<ServiceRequisiteDtos.Response>> hrApprove(
            @PathVariable Long id,
            @RequestBody(required = false) ServiceRequisiteDtos.HrApproveRequest body,
            @RequestHeader(value = "X-Actor", required = false) String actor
    ) {
        var dsr = dsrRepo.findByIdWithGraph(id)
                .orElseThrow(() -> new com.example.Transport.exception.BadRequestException("DriverServiceRequest not found: " + id));
        if (dsr.getHrApproval() == HrApprovalStatus.REJECTED) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Already REJECTED"));
        }

        // mark approved
        dsr.setHrApproval(HrApprovalStatus.APPROVED);
        dsr.setUpdatedBy(actor == null ? "system" : actor);
        dsrRepo.save(dsr);

        // create Service Requisite (idempotent)
        var sr = serviceRequisiteService.createFromDsr(dsr, dsr.getVehicle(), body, actor);

        return ResponseEntity.ok(ApiResponse.success("HR approved and Service Requisite created", sr));
    }

    @PatchMapping("/{id}/hr-decline")
    public ResponseEntity<ApiResponse<Void>> hrDecline(
            @PathVariable Long id,
            @RequestHeader(value = "X-Actor", required = false) String actor
    ) {
        var dsr = dsrRepo.findByIdWithGraph(id)
                .orElseThrow(() -> new com.example.Transport.exception.BadRequestException("DriverServiceRequest not found: " + id));
        if (dsr.getHrApproval() == HrApprovalStatus.APPROVED) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Already APPROVED; cannot decline"));
        }
        dsr.setHrApproval(HrApprovalStatus.REJECTED);
        dsr.setUpdatedBy(actor == null ? "system" : actor);
        dsrRepo.save(dsr);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
