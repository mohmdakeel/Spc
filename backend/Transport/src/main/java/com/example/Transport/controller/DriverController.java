// controller/DriverController.java
package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.entity.Driver;
import com.example.Transport.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Driver>>> listActive(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(driverService.listActive(page, size, search)));
    }

    @GetMapping("/deleted")
    public ResponseEntity<ApiResponse<Page<Driver>>> listDeleted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(driverService.listDeleted(page, size, search)));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Driver>> getOne(@PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getDriverById(employeeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Driver>> create(@Valid @RequestBody Driver body,
                                                      @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.create(body, actor)));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Driver>> update(@PathVariable String employeeId,
                                                      @RequestBody Driver patch,   // <- @Valid removed
                                                      @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.update(employeeId, patch, actor)));
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable String employeeId,
                                                        @RequestHeader(value = "X-Actor", required = false) String actor) {
        driverService.softDelete(employeeId, actor);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{employeeId}/restore")
    public ResponseEntity<ApiResponse<Driver>> restore(@PathVariable String employeeId,
                                                       @RequestHeader(value = "X-Actor", required = false) String actor) {
        return ResponseEntity.ok(ApiResponse.success(driverService.restore(employeeId, actor)));
    }
}
