package com.example.Transport.service;

import com.example.Transport.entity.ChangeHistory;
import com.example.Transport.entity.Driver;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.example.Transport.repository.DriverRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final ChangeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    /* -------------------- LIST -------------------- */

    public Page<Driver> listActive(int page, int size, String search) {
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (search != null && !search.isBlank()) {
            return driverRepository.searchByIsDeleted(0, search.trim(), p);
        }
        return driverRepository.findByIsDeleted(0, p);
    }

    public Page<Driver> listDeleted(int page, int size, String search) {
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "deletedAt"));
        if (search != null && !search.isBlank()) {
            return driverRepository.searchByIsDeleted(1, search.trim(), p);
        }
        return driverRepository.findByIsDeleted(1, p);
    }

    /* -------------------- GET -------------------- */

    public Driver getDriverById(String employeeId) {
        return driverRepository.findById(employeeId)
                .filter(d -> d.getIsDeleted() == 0)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found or deleted: " + employeeId));
    }

    public Optional<Driver> getAnyDriverById(String employeeId) {
        return driverRepository.findById(employeeId);
    }

    /* -------------------- CREATE (revive if soft-deleted) -------------------- */

    @Transactional
    public Driver create(Driver d, String actor) {
        if (d.getEmployeeId() == null || d.getEmployeeId().isBlank()) {
            throw new IllegalArgumentException("Employee ID is mandatory");
        }

        var existingOpt = driverRepository.findById(d.getEmployeeId());
        if (existingOpt.isPresent()) {
            var existing = existingOpt.get();

            // If the existing record is soft-deleted, revive and patch provided fields.
            if (existing.getIsDeleted() != null && existing.getIsDeleted() == 1) {
                String prev = toJson(existing);

                if (d.getName() != null) existing.setName(d.getName());
                if (d.getPhone() != null) existing.setPhone(d.getPhone());
                if (d.getEmail() != null) existing.setEmail(d.getEmail());
                if (d.getLicenseNumber() != null) existing.setLicenseNumber(d.getLicenseNumber());
                if (d.getLicenseExpiryDate() != null) existing.setLicenseExpiryDate(d.getLicenseExpiryDate());
                if (d.getDrivingExperience() != null) existing.setDrivingExperience(d.getDrivingExperience());
                if (d.getStatus() != null) existing.setStatus(d.getStatus());

                existing.setIsDeleted(0);
                existing.setDeletedAt(null);
                existing.setDeletedBy(null);

                var saved = driverRepository.save(existing);
                logHistory("Driver", saved.getEmployeeId(), "Restored", actor, prev, toJson(saved));
                return saved;
            }

            // Otherwise: active conflict
            throw new IllegalArgumentException("Active driver already exists with employeeId=" + d.getEmployeeId());
        }

        // No existing record: create fresh
        Driver saved = driverRepository.save(d);
        logHistory("Driver", saved.getEmployeeId(), "Created", actor, null, toJson(saved));
        return saved;
    }

    /* -------------------- UPDATE -------------------- */

    @Transactional
    public Driver update(String employeeId, Driver patch, String actor) {
        Driver existing = driverRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + employeeId));
        String prev = toJson(existing);

        if (patch.getName() != null) existing.setName(patch.getName());
        if (patch.getPhone() != null) existing.setPhone(patch.getPhone());
        if (patch.getEmail() != null) existing.setEmail(patch.getEmail());
        if (patch.getLicenseNumber() != null) existing.setLicenseNumber(patch.getLicenseNumber());
        if (patch.getLicenseExpiryDate() != null) existing.setLicenseExpiryDate(patch.getLicenseExpiryDate());
        if (patch.getDrivingExperience() != null) existing.setDrivingExperience(patch.getDrivingExperience());
        if (patch.getStatus() != null) existing.setStatus(patch.getStatus());

        Driver saved = driverRepository.save(existing);
        logHistory("Driver", saved.getEmployeeId(), "Updated", actor, prev, toJson(saved));
        return saved;
    }

    /* -------------------- SOFT DELETE & RESTORE -------------------- */

    @Transactional
    public void softDelete(String employeeId, String actor) {
        Driver d = driverRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + employeeId));
        String prev = toJson(d);
        d.setIsDeleted(1);
        d.setDeletedBy(actor);
        d.setDeletedAt(new Date());
        Driver saved = driverRepository.save(d);
        logHistory("Driver", employeeId, "Deleted", actor, prev, toJson(saved));
    }

    /** Restore a soft-deleted driver */
    @Transactional
    public Driver restore(String employeeId, String actor) {
        Driver d = driverRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + employeeId));
        if (d.getIsDeleted() == 0) return d; // already active
        String prev = toJson(d);
        d.setIsDeleted(0);
        d.setDeletedBy(null);
        d.setDeletedAt(null);
        Driver saved = driverRepository.save(d);
        logHistory("Driver", saved.getEmployeeId(), "Restored", actor, prev, toJson(saved));
        return saved;
    }

    /* -------------------- HELPERS -------------------- */

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{\"$error\":\"" + e.getMessage() + "\"}";
        }
    }

    private void logHistory(String type, String id, String action, String actor, String prev, String now) {
        historyRepository.save(ChangeHistory.builder()
                .entityType(type)
                .entityId(id)
                .action(action)
                .performedBy(actor == null ? "system" : actor)
                .timestamp(new Date())
                .previousData(prev)
                .newData(now)
                .build());
    }
}
