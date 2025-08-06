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

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public Vehicle addVehicle(Vehicle vehicle) {
        vehicle.setDeleted(false); // Ensures the vehicle is not marked as deleted when created
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        
        // Saving history for vehicle creation
        saveHistory("Vehicle", String.valueOf(savedVehicle.getId()), "Created", null);
        
        return savedVehicle;
    }

    @Transactional
    public Vehicle updateVehicle(Long vehicleId, Vehicle vehicleDetails) {
        Vehicle existingVehicle = vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));

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

        // Saving history for vehicle update
        saveHistory("Vehicle", String.valueOf(existingVehicle.getId()), "Updated", null);

        return vehicleRepository.save(existingVehicle);
    }

    @Transactional
    public void deleteVehicle(Long vehicleId) {
        Vehicle existingVehicle = vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));

        String deletedData;
        try {
            deletedData = objectMapper.writeValueAsString(existingVehicle);
        } catch (Exception e) {
            deletedData = "Error serializing vehicle data";
        }

        existingVehicle.setDeleted(true); // Sets isDeleted = 1 (soft delete)
        existingVehicle.setDeletedBy("system");
        existingVehicle.setDeletedAt(new Date());

        // Saving history for vehicle delete action
        saveHistory("Vehicle", String.valueOf(existingVehicle.getId()), "Deleted", deletedData);

        vehicleRepository.save(existingVehicle);
    }

    public Vehicle getVehicleById(Long vehicleId) {
        return vehicleRepository.findByIdAndIsDeleted(vehicleId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or is deleted"));
    }

    private void saveHistory(String entityType, String entityId, String action, String deletedData) {
        History history = History.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy("system")
                .timestamp(new Date())
                .deletedData(deletedData)
                .build();
        historyRepository.save(history); // Save history
    }
}
