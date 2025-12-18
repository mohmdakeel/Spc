package com.example.Transport.service;

import com.example.Transport.dto.CreateFuelLogDto;
import com.example.Transport.entity.FuelLog;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.FuelType;
import com.example.Transport.repository.FuelLogRepository;
import com.example.Transport.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FuelLogService {

    private final FuelLogRepository fuelLogRepository;
    private final VehicleRepository vehicleRepository;

    public List<FuelLog> list(String month, Long vehicleId, String from, String to) {
        Date fromDate = parseDate(from, false);
        Date toDate = parseDate(to, true);
        return fuelLogRepository.search(normalizeMonth(month), vehicleId, fromDate, toDate);
    }

    @Transactional
    public FuelLog create(CreateFuelLogDto dto, String actor) {
        if (dto == null || dto.getVehicleId() == null) {
            throw new IllegalArgumentException("vehicleId is required");
        }

        Vehicle vehicle = vehicleRepository.findByIdAndIsDeleted(dto.getVehicleId(), 0)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found or deleted: id=" + dto.getVehicleId()));

        LocalDate logDate = Optional.ofNullable(dto.getLogDate()).orElse(LocalDate.now(ZoneOffset.UTC));
        String month = Optional.ofNullable(normalizeMonth(dto.getMonth()))
                .orElse(formatMonth(logDate));

        Long deltaKm = dto.getDeltaKm();
        if (deltaKm == null && dto.getStartOdo() != null && dto.getEndOdo() != null) {
            deltaKm = dto.getEndOdo() - dto.getStartOdo();
        }
        if (deltaKm != null && deltaKm < 0) {
            throw new IllegalArgumentException("End odometer cannot be less than start odometer");
        }

        Double efficiency = dto.getEfficiencyUsed() != null
                ? dto.getEfficiencyUsed()
                : vehicle.getFuelEfficiency();

        Double litres = dto.getLitres();
        if (litres == null && deltaKm != null && efficiency != null && efficiency > 0) {
            litres = deltaKm / efficiency;
        }

        Double pricePerL = dto.getPricePerL();
        Double cost = dto.getCost();
        if (cost == null && litres != null && pricePerL != null) {
            cost = litres * pricePerL;
        }

        FuelLog log = new FuelLog();
        log.setVehicle(vehicle);
        log.setVehicleNumber(vehicle.getVehicleNumber());
        log.setVehicleType(vehicle.getVehicleType());
        log.setFuelType(dto.getFuelType() != null
                ? dto.getFuelType()
                : Optional.ofNullable(vehicle.getFuelType()).orElse(FuelType.PETROL));

        log.setMonth(month);
        log.setLogDate(toDate(logDate));
        log.setStartOdo(dto.getStartOdo());
        log.setEndOdo(dto.getEndOdo());
        log.setDeltaKm(deltaKm);
        log.setLitres(litres);
        log.setPricePerL(pricePerL);
        log.setCost(cost);
        log.setEfficiencyUsed(efficiency);

        // Let auditing populate createdBy/updatedBy; fall back to actor if provided.
        if (actor != null && !actor.isBlank()) {
            log.setCreatedBy(actor);
            log.setUpdatedBy(actor);
        }

        return fuelLogRepository.save(log);
    }

    private Date toDate(LocalDate date) {
        return Date.from(date.atStartOfDay().toInstant(ZoneOffset.UTC));
    }

    private Date parseDate(String iso, boolean endOfDay) {
        if (iso == null || iso.isBlank()) return null;
        try {
            LocalDate d = LocalDate.parse(iso);
            var time = endOfDay ? d.atTime(23, 59, 59) : d.atStartOfDay();
            return Date.from(time.toInstant(ZoneOffset.UTC));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date: " + iso);
        }
    }

    private String normalizeMonth(String month) {
        if (month == null || month.isBlank()) return null;
        try {
            return YearMonth.parse(month.trim()).toString();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid month format, expected yyyy-MM");
        }
    }

    private String formatMonth(LocalDate date) {
        return YearMonth.from(date).toString();
    }
}
