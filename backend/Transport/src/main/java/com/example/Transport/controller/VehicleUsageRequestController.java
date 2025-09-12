package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.VehicleUsageRequest;
import com.example.Transport.enums.RequestStatus;
import com.example.Transport.enums.UserRole;
import com.example.Transport.service.VehicleTripService;
import com.example.Transport.service.VehicleUsageRequestService;
import com.example.Transport.util.RoleGuard;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

import static java.util.EnumSet.of;

@RestController
@RequestMapping("/api/usage-requests")
@RequiredArgsConstructor
public class VehicleUsageRequestController {

    private final VehicleUsageRequestService svc;
    private final VehicleTripService tripSvc;

    // ===== Create / Read (unchanged) =====
    @PostMapping
    public ResponseEntity<ApiResponse<VehicleUsageRequest>> create(@RequestBody CreateDto dto,
            @RequestHeader(value = "X-Role", required = false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.STAFF, UserRole.ADMIN));
        var req = VehicleUsageRequest.builder()
                .applicantName(dto.applicantName).employeeId(dto.employeeId).department(dto.department)
                .travelOfficerName(dto.travelOfficerName)
                .dateOfTravel(dto.dateOfTravel).timeFrom(dto.timeFrom).timeTo(dto.timeTo)
                .fromLocation(dto.fromLocation).toLocation(dto.toLocation)
                .officialDescription(dto.officialDescription).goods(dto.goods)
                .itemsCount(dto.itemsCount).goodsWeightKg(dto.goodsWeightKg)
                .createdBy(dto.actor).updatedBy(dto.actor)
                .build();
        var saved = svc.create(req, dto.actor);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @GetMapping public List<VehicleUsageRequest> listAll() { return svc.listAll(); }
    @GetMapping("/{id}") public VehicleUsageRequest get(@PathVariable Long id) { return svc.get(id); }
    @GetMapping("/status/{status}") public List<VehicleUsageRequest> listByStatus(@PathVariable RequestStatus status) { return svc.listByStatus(status); }

    // ===== NEW: Pool assign multiple requests into one Trip =====
    @PostMapping("/pool-assign")
    public ResponseEntity<ApiResponse<Map<String, Object>>> poolAssign(@RequestBody PoolAssignDto d,
            @RequestHeader(value = "X-Role", required = false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.INCHARGE, UserRole.ADMIN));
        var trip = tripSvc.createTrip(d.actor, d.requestIds, d.vehicleId, d.vehicleNumber,
                d.driverId, d.driverName, d.driverPhone, d.pickupAt, d.expectedReturnAt, d.instructions);
        return ResponseEntity.ok(ApiResponse.success(Map.of("trip", trip)));
    }

    // ===== Keep old single-assign endpoint, now implemented via Trip =====
    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignSingle(@PathVariable Long id, @RequestBody AssignDto d,
            @RequestHeader(value = "X-Role", required = false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.INCHARGE, UserRole.ADMIN));
        var trip = tripSvc.createTrip(d.actor, List.of(id), d.vehicleId, d.vehicleNumber,
                d.driverId, d.driverName, d.driverPhone, d.pickupAt, d.expectedReturnAt, d.instructions);
        return ResponseEntity.ok(ApiResponse.success(Map.of("trip", trip)));
    }

    // ===== Gate by Request ID (compatible): resolves Trip and logs there =====
    @PostMapping("/{id}/gate/exit")
    public ResponseEntity<ApiResponse<Object>> gateExitByRequest(@PathVariable Long id, @RequestBody GateExitDto d,
            @RequestHeader(value = "X-Role", required = false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.GATE, UserRole.ADMIN));
        var req = svc.get(id);
        if (req.getTripId() == null) {
            // fallback: create a trip on-the-fly for this lone request
            var trip = tripSvc.createTrip(d.actor, List.of(id), req.getAssignedVehicleId(), req.getAssignedVehicleNumber(),
                    req.getAssignedDriverId(), req.getAssignedDriverName(), req.getAssignedDriverPhone(),
                    req.getScheduledPickupAt(), req.getScheduledReturnAt(), req.getSpecialInstructions());
            return ResponseEntity.ok(ApiResponse.success(tripSvc.gateExitTrip(trip.getId(), d.actor, d.exitOdometerKm)));
        }
        return ResponseEntity.ok(ApiResponse.success(tripSvc.gateExitTrip(req.getTripId(), d.actor, d.exitOdometerKm)));
    }

    @PostMapping("/{id}/gate/entry")
    public ResponseEntity<ApiResponse<Object>> gateEntryByRequest(@PathVariable Long id, @RequestBody GateEntryDto d,
            @RequestHeader(value = "X-Role", required = false) String xRole) {
        RoleGuard.require(xRole, of(UserRole.GATE, UserRole.ADMIN));
        var req = svc.get(id);
        if (req.getTripId() == null) throw new IllegalArgumentException("No trip associated with this request");
        return ResponseEntity.ok(ApiResponse.success(tripSvc.gateEntryTrip(req.getTripId(), d.actor, d.entryOdometerKm)));
    }

    // ===== Simple metrics kept =====
    @GetMapping("/metrics")
    public Map<String, Object> metrics() {
        var list = svc.listAll();
        long total = list.size();
        var byStatus = list.stream().collect(java.util.stream.Collectors.groupingBy(
                VehicleUsageRequest::getStatus, java.util.stream.Collectors.counting()));
        var nextDay = list.stream().filter(r -> LocalDate.now().plusDays(1).equals(r.getDateOfTravel())).limit(10).toList();
        return Map.of("total", total, "byStatus", byStatus, "nextDayTop10", nextDay);
    }

    // ===== DTOs =====
    @Data public static class CreateDto {
        public String applicantName; public String employeeId; public String department;
        public String travelOfficerName;
        public java.time.LocalDate dateOfTravel; public java.time.LocalTime timeFrom; public java.time.LocalTime timeTo;
        public String fromLocation; public String toLocation; public String officialDescription; public String goods;
        public Integer itemsCount; public Double goodsWeightKg;
        public String actor;
    }
    @Data public static class AssignDto {
        public String actor;
        public Long vehicleId; public String vehicleNumber;
        public Long driverId;  public String driverName; public String driverPhone;
        public java.util.Date pickupAt; public java.util.Date expectedReturnAt;
        public String instructions;
    }
    @Data public static class PoolAssignDto extends AssignDto { public List<Long> requestIds; }
    @Data public static class GateExitDto { public String actor; public Long exitOdometerKm; }
    @Data public static class GateEntryDto { public String actor; public Long entryOdometerKm; }
}
