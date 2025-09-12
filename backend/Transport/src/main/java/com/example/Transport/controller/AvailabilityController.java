package com.example.Transport.controller;

import com.example.Transport.enums.TripStatus;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.repository.DriverRepository;
import com.example.Transport.service.VehicleTripService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final VehicleRepository vehicleRepo;
    private final DriverRepository driverRepo;
    private final VehicleTripService tripSvc;

    @GetMapping
    public Map<String, Object> get(@RequestParam("from") long fromMs, @RequestParam("to") long toMs) {
        var from = new Date(fromMs);
        var to = new Date(Math.max(fromMs + 1, toMs)); // avoid same value edge case

        var busy = tripSvc.availability(from, to);
        Map<Long, Integer> vehiclesBusy = (Map<Long, Integer>) busy.get("vehiclesBusy");
        Map<Long, Integer> driversBusy = (Map<Long, Integer>) busy.get("driversBusy");

        var vehicles = vehicleRepo.findAll();
        var drivers = driverRepo.findAll();

        var vehicleList = vehicles.stream().map(v -> Map.of(
                "id", v.getId(),
                "vehicleNumber", v.getVehicleNumber(),
                "status", v.getStatus(),
                "busyCount", vehiclesBusy.getOrDefault(v.getId(), 0)
        )).toList();

        var driverList = drivers.stream().map(d -> Map.of(
                "id", d.getEmployeeId(), // if numeric id in your repo, adapt accordingly
                "name", d.getName(),
                "status", d.getStatus(),
                "busyCount", driversBusy.getOrDefault(parseLongSafe(d.getEmployeeId()), 0)
        )).toList();

        return Map.of(
                "window", Map.of("from", from, "to", to),
                "vehicles", vehicleList,
                "drivers", driverList,
                "activeTrips", busy.get("trips"),
                "statusesConsidered", List.of(TripStatus.SCHEDULED, TripStatus.DISPATCHED)
        );
    }

    private Long parseLongSafe(String s) { try { return Long.parseLong(s); } catch (Exception e) { return -1L; } }
}
