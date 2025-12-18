package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.dto.CreateFuelLogDto;
import com.example.Transport.entity.FuelLog;
import com.example.Transport.service.FuelLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel-logs")
@RequiredArgsConstructor
public class FuelLogController {

    private final FuelLogService fuelLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FuelLog>>> list(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(ApiResponse.success(fuelLogService.list(month, vehicleId, from, to)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FuelLog>> create(@Valid @RequestBody CreateFuelLogDto dto,
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(fuelLogService.create(dto, actor)));
    }
}
