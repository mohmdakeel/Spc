package com.example.Transport.service;

import com.example.Transport.entity.Driver;
import com.example.Transport.entity.History;
import com.example.Transport.repository.DriverRepository;
import com.example.Transport.repository.HistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public Driver addDriver(Driver driver) {
        // 🔁 Fixed: use count and compare manually
        if (driverRepository.countByEmployeeId(driver.getEmployeeId()) == 0) {
            throw new IllegalArgumentException("Invalid employee ID: not found in employee table");
        }

        driver.setDeleted(false); // will set isDeleted = 0
        Driver savedDriver = driverRepository.save(driver);
        saveHistory("Driver", savedDriver.getEmployeeId(), "Created", null);
        return savedDriver;
    }

    @Transactional
    public Driver updateDriver(String employeeId, Driver driverDetails) {
        Driver existingDriver = driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted"));

        existingDriver.setName(driverDetails.getName());
        existingDriver.setPhone(driverDetails.getPhone());
        existingDriver.setEmail(driverDetails.getEmail());
        existingDriver.setLicenseNumber(driverDetails.getLicenseNumber());

        Driver updatedDriver = driverRepository.save(existingDriver);
        saveHistory("Driver", updatedDriver.getEmployeeId(), "Updated", null);
        return updatedDriver;
    }

    @Transactional
    public void deleteDriver(String employeeId) {
        Driver existingDriver = driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted"));

        String deletedData;
        try {
            deletedData = objectMapper.writeValueAsString(existingDriver);
        } catch (Exception e) {
            deletedData = "Error serializing driver data";
        }

        existingDriver.setDeleted(true); // will set isDeleted = 1
        existingDriver.setDeletedBy("system");
        existingDriver.setDeletedAt(new Date());

        driverRepository.save(existingDriver);
        saveHistory("Driver", existingDriver.getEmployeeId(), "Deleted", deletedData);
    }

    public Driver getDriverById(String employeeId) {
        return driverRepository.findByEmployeeIdAndIsDeleted(employeeId, 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or is deleted"));
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
        historyRepository.save(history);
    }
}
