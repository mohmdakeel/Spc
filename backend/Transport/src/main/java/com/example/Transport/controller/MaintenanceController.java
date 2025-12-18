package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.ServiceCandidate;
import com.example.Transport.service.OdometerScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final OdometerScanService odometerScanService;

    /** POST /api/maintenance/auto-odometer-scan */
    @PostMapping("/auto-odometer-scan")
    public ResponseEntity<ApiResponse<List<ServiceCandidate>>> autoScan(
            @RequestHeader(value = "X-Actor", required = false) String actor) {
        var created = odometerScanService.populateAutoOdometer(actor);
        return ResponseEntity.ok(ApiResponse.success(created));
    }
}
