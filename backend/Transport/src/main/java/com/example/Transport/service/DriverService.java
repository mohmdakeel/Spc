package com.example.Transport.service;

import com.example.Transport.entity.Driver;
import com.example.Transport.entity.History;
import com.example.Transport.enums.DriverStatus;
import com.example.Transport.repository.DriverRepository;
import com.example.Transport.repository.HistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@Transactional
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /** Get all active drivers */
    public List<Driver> getAllDrivers() {
        return driverRepository.findByIsDeleted(0);
    }

    /** Add new driver, record history */
    public Driver addDriver(Driver driver) {
        // Optional: Validate against employee table
        // if (driverRepository.countByEmployeeId(driver.getEmployeeId()) == 0) {
        //     throw new IllegalArgumentException("Invalid employee ID: not found in employee table");
        // }
        if (driverRepository.existsById(driver.getEmployeeId())) {
            throw new IllegalArgumentException("Driver with this Employee ID already exists.");
        }

        // Set default status if not provided
        if (driver.getStatus() == null) {
            driver.setStatus(DriverStatus.ACTIVE);    // or INACTIVE, SUSPENDED

        }

        driver.setDeleted(false);
        Driver savedDriver = driverRepository.save(driver);
        saveHistory("Driver", savedDriver.getEmployeeId(), "Created", null);
        return savedDriver;
    }

    /** Update driver, record history with previous data */
    public Driver updateDriver(String employeeId, Driver driverDetails) {
        Driver existingDriver = driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted."));

        // Capture previous state as JSON
        String previousData;
        try {
            previousData = objectMapper.writeValueAsString(existingDriver);
        } catch (Exception e) {
            previousData = "Error serializing previous driver data";
        }

        // Update all fields
        existingDriver.setName(driverDetails.getName());
        existingDriver.setPhone(driverDetails.getPhone());
        existingDriver.setEmail(driverDetails.getEmail());
        existingDriver.setLicenseNumber(driverDetails.getLicenseNumber());
        existingDriver.setLicenseExpiryDate(driverDetails.getLicenseExpiryDate());
        existingDriver.setDrivingExperience(driverDetails.getDrivingExperience());
        existingDriver.setStatus(driverDetails.getStatus());

        Driver updatedDriver = driverRepository.save(existingDriver);
        saveHistory("Driver", updatedDriver.getEmployeeId(), "Updated", previousData);
        return updatedDriver;
    }

    /** Soft delete a driver, record history with previous data */
    public void deleteDriver(String employeeId) {
        Driver existingDriver = driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted."));

        String previousData;
        try {
            previousData = objectMapper.writeValueAsString(existingDriver);
        } catch (Exception e) {
            previousData = "Error serializing driver data";
        }
        existingDriver.setDeleted(true);
        existingDriver.setDeletedBy("system"); // Replace with real username/email if you add authentication
        existingDriver.setDeletedAt(new Date());

        driverRepository.save(existingDriver);
        saveHistory("Driver", existingDriver.getEmployeeId(), "Deleted", previousData);
    }

    /** Get a single driver by ID */
    public Driver getDriverById(String employeeId) {
        return driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted."));
    }

    /** Get all deleted drivers */
    public List<Driver> getDeletedDrivers() {
        return driverRepository.findByIsDeleted(1);
    }

    /** Save history for all actions */
    private void saveHistory(String entityType, String entityId, String action, String previousData) {
        History history = History.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy("system") // Replace with user if you have auth
                .timestamp(new Date())
                .previousData(previousData)
                .build();
        historyRepository.save(history);
    }

    // (OPTIONAL) Get all drivers with expired license
    public List<Driver> getDriversWithExpiredLicense() {
        return driverRepository.findAllWithExpiredLicense();
    }

    // (OPTIONAL) Get all active drivers by status
    public List<Driver> getDriversByStatus(String status) {
        return driverRepository.findByStatusAndIsDeleted(status, 0);
    }
}
