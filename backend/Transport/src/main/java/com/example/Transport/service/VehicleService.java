package com.example.Transport.service;

import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.Vehicle.Status;
import com.example.Transport.entity.History;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.repository.HistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import java.util.Date;
import java.util.List;

@Service
@Transactional
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public Vehicle addVehicle(Vehicle vehicle) {
        vehicle.setDeleted(false);

        // Set status if null (default ACTIVE)
        if (vehicle.getStatus() == null) {
            vehicle.setStatus(Status.ACTIVE);
        }

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        saveHistory("Vehicle", String.valueOf(savedVehicle.getId()), "Created", null);

        return savedVehicle;
    }

    public Vehicle updateVehicle(Long vehicleId, Vehicle vehicleDetails) {
        Vehicle existingVehicle = vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));

        // Capture previous data before update
        String previousData;
        try {
            previousData = objectMapper.writeValueAsString(existingVehicle);
        } catch (Exception e) {
            previousData = "Error serializing vehicle data";
        }

        existingVehicle.setVehicleNumber(vehicleDetails.getVehicleNumber());
        existingVehicle.setVehicleType(vehicleDetails.getVehicleType());
        existingVehicle.setBrand(vehicleDetails.getBrand());
        existingVehicle.setModel(vehicleDetails.getModel());
        existingVehicle.setChassisNumber(vehicleDetails.getChassisNumber());
        existingVehicle.setEngineNumber(vehicleDetails.getEngineNumber());
        existingVehicle.setManufactureDate(vehicleDetails.getManufactureDate());
        existingVehicle.setTotalKmDriven(vehicleDetails.getTotalKmDriven());
        existingVehicle.setFuelEfficiency(vehicleDetails.getFuelEfficiency());
        existingVehicle.setPresentCondition(vehicleDetails.getPresentCondition());
        // Status update with null check
        existingVehicle.setStatus(vehicleDetails.getStatus() != null ? vehicleDetails.getStatus() : existingVehicle.getStatus());

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

        saveHistory("Vehicle", String.valueOf(existingVehicle.getId()), "Updated", previousData);

        return updatedVehicle;
    }

    // Change vehicle status (use this for status-only changes from UI)
    public Vehicle changeVehicleStatus(Long vehicleId, Status status) {
        Vehicle vehicle = vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));
        String previousData;
        try {
            previousData = objectMapper.writeValueAsString(vehicle);
        } catch (Exception e) {
            previousData = "Error serializing vehicle data";
        }
        vehicle.setStatus(status);
        Vehicle saved = vehicleRepository.save(vehicle);
        saveHistory("Vehicle", String.valueOf(vehicle.getId()), "StatusChanged", previousData);
        return saved;
    }

    public void deleteVehicle(Long vehicleId) {
        Vehicle existingVehicle = vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));

        String previousData;
        try {
            previousData = objectMapper.writeValueAsString(existingVehicle);
        } catch (Exception e) {
            previousData = "Error serializing vehicle data";
        }

        existingVehicle.setDeleted(true);
        existingVehicle.setDeletedBy("system");
        existingVehicle.setDeletedAt(new Date());
        existingVehicle.setStatus(Status.REMOVED);

        vehicleRepository.save(existingVehicle);

        saveHistory("Vehicle", String.valueOf(existingVehicle.getId()), "Deleted", previousData);
    }

    public Vehicle getVehicleById(Long vehicleId) {
        return vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findByIsDeleted(0);
    }

    public List<Vehicle> getDeletedVehicles() {
        return vehicleRepository.findByIsDeleted(1);
    }

    private void saveHistory(String entityType, String entityId, String action, String previousData) {
        History history = History.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy("system")
                .timestamp(new Date())
                .previousData(previousData)
                .build();
        historyRepository.save(history);
    }
}
