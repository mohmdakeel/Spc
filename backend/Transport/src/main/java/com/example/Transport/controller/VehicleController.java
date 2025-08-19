package com.example.Transport.controller;

import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.Vehicle.Status;
import com.example.Transport.service.VehicleService;
import com.example.Transport.service.HistoryService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private HistoryService historyService;

    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.addVehicle(vehicle));
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long vehicleId, 
                                                @Valid @RequestBody Vehicle vehicleDetails) {
        return ResponseEntity.ok(vehicleService.updateVehicle(vehicleId, vehicleDetails));
    }

    @PutMapping("/{vehicleId}/status")
    public ResponseEntity<Vehicle> changeStatus(@PathVariable Long vehicleId, @RequestParam Status status) {
        return ResponseEntity.ok(vehicleService.changeVehicleStatus(vehicleId, status));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long vehicleId) {
        vehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<Vehicle> getVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<Vehicle>> getDeletedVehicles() {
        return ResponseEntity.ok(vehicleService.getDeletedVehicles());
    }

    // Endpoint to get allowed statuses for frontend (for dropdown etc.)
    @GetMapping("/statuses")
    public ResponseEntity<Status[]> getAllowedStatuses() {
        return ResponseEntity.ok(Status.values());
    }

    // ✅ Vehicle history endpoint to fetch vehicle history
    @GetMapping("/{vehicleId}/history")
    public ResponseEntity<List<?>> getVehicleHistory(@PathVariable Long vehicleId) {
        List<?> history = historyService.getHistoryByEntity("Vehicle", vehicleId.toString());
        return ResponseEntity.ok(history);
    }
}
