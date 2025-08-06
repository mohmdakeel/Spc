package com.example.Transport.controller;

import com.example.Transport.entity.Vehicle;
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

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long vehicleId) {
        vehicleService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<Vehicle> getVehicle(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
    }

    // ✅ Vehicle history endpoint to fetch vehicle history
    @GetMapping("/{vehicleId}/history")
    public ResponseEntity<List<?>> getVehicleHistory(@PathVariable Long vehicleId) {
        // Fetching the history for this specific vehicle
        List<?> history = historyService.getHistoryByEntity("Vehicle", vehicleId.toString());
        return ResponseEntity.ok(history);
    }
}
