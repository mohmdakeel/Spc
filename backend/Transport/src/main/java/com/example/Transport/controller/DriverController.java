package com.example.Transport.controller;

import com.example.Transport.entity.Driver;
import com.example.Transport.entity.History;
import com.example.Transport.repository.HistoryRepository;
import com.example.Transport.service.DriverService;
import com.example.Transport.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @Autowired
    private HistoryService historyService;

    @Autowired
    private HistoryRepository historyRepository;

    // 1. Get all active (not deleted) drivers
    @GetMapping
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    // 2. Create a new driver
    @PostMapping
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(driverService.addDriver(driver));
    }

    // 3. Update a driver
    @PutMapping("/{employeeId}")
    public ResponseEntity<Driver> updateDriver(@PathVariable String employeeId,
                                               @RequestBody Driver driverDetails) {
        return ResponseEntity.ok(driverService.updateDriver(employeeId, driverDetails));
    }

    // 4. Soft delete a driver
    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> deleteDriver(@PathVariable String employeeId) {
        driverService.deleteDriver(employeeId);
        return ResponseEntity.noContent().build();
    }

    // 5. Get driver by ID, including previous version (for modals/history view)
    @GetMapping("/{employeeId}")
    public ResponseEntity<Map<String, Object>> getDriver(@PathVariable String employeeId) {
        Driver driver = driverService.getDriverById(employeeId);

        // Find most recent "Updated" history
        List<History> updates = historyRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("Driver", employeeId);

        Map<String, Object> previousData = null;
        for (History h : updates) {
            if ("Updated".equals(h.getAction()) && h.getPreviousData() != null) {
                try {
                    previousData = new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(h.getPreviousData(), HashMap.class);
                } catch (Exception ex) {
                    previousData = Collections.singletonMap("raw", h.getPreviousData());
                }
                break;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("driver", driver);
        response.put("previousData", previousData);

        return ResponseEntity.ok(response);
    }

    // 6. Get all history for a driver
    @GetMapping("/{employeeId}/history")
    public ResponseEntity<List<History>> getDriverHistory(@PathVariable String employeeId) {
        List<History> history = historyService.getHistoryByEntity("Driver", employeeId);
        return ResponseEntity.ok(history);
    }

    // 7. Get all deleted drivers
    @GetMapping("/deleted")
    public ResponseEntity<List<Driver>> getDeletedDrivers() {
        return ResponseEntity.ok(driverService.getDeletedDrivers());
    }

    // 8. Get all drivers by status (Active/Inactive/Suspended/etc)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Driver>> getDriversByStatus(@PathVariable String status) {
        return ResponseEntity.ok(driverService.getDriversByStatus(status));
    }

    // 9. Get all drivers with expired license
    @GetMapping("/expired-license")
    public ResponseEntity<List<Driver>> getDriversWithExpiredLicense() {
        return ResponseEntity.ok(driverService.getDriversWithExpiredLicense());
    }

    // 10. Get all drivers with license expiring within next X days (default 30)
    @GetMapping("/expiring-license")
    public ResponseEntity<List<Driver>> getDriversWithExpiringLicense(@RequestParam(defaultValue = "30") int days) {
        Date now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.DAY_OF_MONTH, days);

        Date toDate = cal.getTime();
        List<Driver> expiring = driverService.getAllDrivers().stream()
            .filter(d -> d.getLicenseExpiryDate() != null
                    && d.getLicenseExpiryDate().after(now)
                    && d.getLicenseExpiryDate().before(toDate)
                    && (d.getIsDeleted() == null || d.getIsDeleted() == 0))
            .toList();

        return ResponseEntity.ok(expiring);
    }

    // 11. Search drivers by keyword (name, employeeId, or phone)
    @GetMapping("/search")
    public ResponseEntity<List<Driver>> searchDrivers(@RequestParam String query) {
        List<Driver> all = driverService.getAllDrivers();
        String q = query.trim().toLowerCase();
        List<Driver> filtered = all.stream()
            .filter(d -> d.getName().toLowerCase().contains(q)
                      || d.getEmployeeId().toLowerCase().contains(q)
                      || (d.getPhone() != null && d.getPhone().contains(q)))
            .toList();
        return ResponseEntity.ok(filtered);
    }
}
