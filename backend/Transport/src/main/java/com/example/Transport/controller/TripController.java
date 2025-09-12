package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.VehicleTrip;
import com.example.Transport.enums.TripStatus;
import com.example.Transport.enums.UserRole;
import com.example.Transport.repository.VehicleTripRepository;
import com.example.Transport.service.VehicleTripService;
import com.example.Transport.util.RoleGuard;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import static java.util.EnumSet.of;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final VehicleTripService tripSvc;
    private final VehicleTripRepository tripRepo;

    @GetMapping("/status/{s}")
    public List<VehicleTrip> byStatus(@PathVariable TripStatus s) {
        return tripRepo.findByStatus(s);
    }

    @GetMapping("/{id}")
    public VehicleTrip get(@PathVariable Long id) {
        return tripRepo.findById(id).orElseThrow();
    }

    @PostMapping("/{id}/add-request")
    public ResponseEntity<ApiResponse<VehicleTrip>> addRequest(@PathVariable Long id, @RequestBody AddRemoveDto d,
            @RequestHeader(value="X-Role", required=false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.INCHARGE, UserRole.ADMIN));
        var t = tripSvc.addRequestToTrip(id, d.requestId, d.actor);
        return ResponseEntity.ok(ApiResponse.success(t));
    }

    @PostMapping("/{id}/remove-request")
    public ResponseEntity<ApiResponse<VehicleTrip>> removeRequest(@PathVariable Long id, @RequestBody AddRemoveDto d,
            @RequestHeader(value="X-Role", required=false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.INCHARGE, UserRole.ADMIN));
        var t = tripSvc.removeRequestFromTrip(id, d.requestId, d.actor);
        return ResponseEntity.ok(ApiResponse.success(t));
    }

    @PostMapping("/{id}/gate/exit")
    public VehicleTrip gateExit(@PathVariable Long id, @RequestBody GateDto d,
            @RequestHeader(value="X-Role", required=false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.GATE, UserRole.ADMIN));
        return tripSvc.gateExitTrip(id, d.actor, d.odoKm);
    }

    @PostMapping("/{id}/gate/entry")
    public VehicleTrip gateEntry(@PathVariable Long id, @RequestBody GateDto d,
            @RequestHeader(value="X-Role", required=false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.GATE, UserRole.ADMIN));
        return tripSvc.gateEntryTrip(id, d.actor, d.odoKm);
    }

    @Data static class AddRemoveDto { public String actor; public Long requestId; }
    @Data static class GateDto { public String actor; public Long odoKm; }
}
