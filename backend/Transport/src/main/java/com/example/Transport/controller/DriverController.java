package com.example.Transport.controller;

import com.example.Transport.entity.Driver;
import com.example.Transport.service.DriverService;
import com.example.Transport.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @Autowired
    private HistoryService historyService;

    @PostMapping
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(driverService.addDriver(driver));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<Driver> updateDriver(@PathVariable String employeeId, 
                                               @RequestBody Driver driverDetails) {
        return ResponseEntity.ok(driverService.updateDriver(employeeId, driverDetails));
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> deleteDriver(@PathVariable String employeeId) {
        driverService.deleteDriver(employeeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<Driver> getDriver(@PathVariable String employeeId) {
        return ResponseEntity.ok(driverService.getDriverById(employeeId));
    }

    // ✅ Add History route to fetch driver history
    @GetMapping("/{employeeId}/history")
    public ResponseEntity<List<?>> getDriverHistory(@PathVariable String employeeId) {
        List<?> history = historyService.getHistoryByEntity("Driver", employeeId);
        return ResponseEntity.ok(history);
    }
}
