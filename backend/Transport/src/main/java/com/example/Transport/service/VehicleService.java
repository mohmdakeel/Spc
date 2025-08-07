package com.example.Transport.service;

import com.example.Transport.entity.Vehicle;
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
        existingVehicle.setStatus(vehicleDetails.getStatus());

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);

        // Saving history for vehicle update
        saveHistory("Vehicle", String.valueOf(existingVehicle.getId()), "Updated", previousData);

        return updatedVehicle;
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

        vehicleRepository.save(existingVehicle);

        // Saving history for vehicle delete action
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
