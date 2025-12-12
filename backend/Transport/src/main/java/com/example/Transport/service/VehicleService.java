package com.example.Transport.service;

import com.example.Transport.entity.ChangeHistory;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.example.Transport.repository.VehicleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ChangeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    public Page<Vehicle> listActive(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (search != null && !search.isBlank()) {
            return vehicleRepository.searchByIsDeleted(0, search.trim(), pageable);
        }
        return vehicleRepository.findByIsDeleted(0, pageable);
    }

    public Page<Vehicle> listDeleted(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "deletedAt"));
        if (search != null && !search.isBlank()) {
            return vehicleRepository.searchByIsDeleted(1, search.trim(), pageable);
        }
        return vehicleRepository.findByIsDeleted(1, pageable);
    }

    public Vehicle getActiveById(Long id) {
        return vehicleRepository.findById(id)
                .filter(v -> v.getIsDeleted() == 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or deleted: id=" + id));
    }

    public Optional<Vehicle> getAnyById(Long id) {
        return vehicleRepository.findById(id);
    }

    @Transactional
    public Vehicle create(Vehicle body, String actor) {
        if (vehicleRepository.existsByVehicleNumberAndIsDeleted(body.getVehicleNumber(), 0)) {
            throw new IllegalArgumentException("Active vehicle already exists with number=" + body.getVehicleNumber());
        }
        Long reg = body.getRegisteredKm();
        Long cur = body.getTotalKmDriven();
        if (reg != null && cur != null && cur < reg) {
            throw new IllegalArgumentException("Current odometer cannot be less than registered odometer");
        }
        body.setRegisteredKm(reg);
        body.setTotalKmDriven(cur);

        Vehicle saved = vehicleRepository.save(body);
        logHistory("Vehicle", String.valueOf(saved.getId()), "Created", actor, null, toJson(saved));
        return saved;
    }

    @Transactional
    public Vehicle update(Long id, Vehicle patch, String actor) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));
        String prev = toJson(existing);

        // compute new odometers; allow edits but enforce consistency
        Long newReg = patch.getRegisteredKm() != null ? patch.getRegisteredKm() : existing.getRegisteredKm();
        Long newCur = patch.getTotalKmDriven() != null ? patch.getTotalKmDriven() : existing.getTotalKmDriven();
        if (newReg != null && newCur != null && newCur < newReg) {
            throw new IllegalArgumentException("Current odometer cannot be less than registered odometer");
        }

        if (patch.getVehicleNumber() != null && !patch.getVehicleNumber().equals(existing.getVehicleNumber())) {
            if (vehicleRepository.existsByVehicleNumberAndIsDeleted(patch.getVehicleNumber(), 0)) {
                throw new IllegalArgumentException("Active vehicle already exists with number=" + patch.getVehicleNumber());
            }
            existing.setVehicleNumber(patch.getVehicleNumber());
        }

        if (patch.getVehicleType() != null) existing.setVehicleType(patch.getVehicleType());
        if (patch.getBrand() != null) existing.setBrand(patch.getBrand());
        if (patch.getModel() != null) existing.setModel(patch.getModel());
        if (patch.getChassisNumber() != null) existing.setChassisNumber(patch.getChassisNumber());
        if (patch.getEngineNumber() != null) existing.setEngineNumber(patch.getEngineNumber());
        if (patch.getManufactureDate() != null) existing.setManufactureDate(patch.getManufactureDate());
        existing.setRegisteredKm(newReg);
        existing.setTotalKmDriven(newCur);
        if (patch.getFuelEfficiency() != null) existing.setFuelEfficiency(patch.getFuelEfficiency());
        if (patch.getPresentCondition() != null) existing.setPresentCondition(patch.getPresentCondition());
        if (patch.getStatus() != null) existing.setStatus(patch.getStatus());

        Vehicle saved = vehicleRepository.save(existing);
        logHistory("Vehicle", String.valueOf(saved.getId()), "Updated", actor, prev, toJson(saved));
        return saved;
    }

    @Transactional
    public void softDelete(Long id, String actor) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));
        String prev = toJson(v);
        v.setIsDeleted(1);
        v.setDeletedBy(actor);
        v.setDeletedAt(new Date());
        Vehicle saved = vehicleRepository.save(v);
        logHistory("Vehicle", String.valueOf(id), "Deleted", actor, prev, toJson(saved));
    }

    /** NEW: restore a soft-deleted vehicle */
    @Transactional
    public Vehicle restore(Long id, String actor) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: id=" + id));
        if (v.getIsDeleted() == 0) return v; // already active
        String prev = toJson(v);
        v.setIsDeleted(0);
        v.setDeletedBy(null);
        v.setDeletedAt(null);
        Vehicle saved = vehicleRepository.save(v);
        logHistory("Vehicle", String.valueOf(saved.getId()), "Restored", actor, prev, toJson(saved));
        return saved;
    }

    private String toJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
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
