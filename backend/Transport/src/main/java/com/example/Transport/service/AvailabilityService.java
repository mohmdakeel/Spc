package com.example.Transport.service;

import com.example.Transport.dto.BusyWindowDto;
import com.example.Transport.dto.DriverAvailabilityDto;
import com.example.Transport.dto.VehicleAvailabilityDto;
import com.example.Transport.repository.UsageRequestAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final UsageRequestAvailabilityRepository repository;

    public List<DriverAvailabilityDto> driverAvailability(LocalDate date, LocalTime from, LocalTime to) {
        LocalDateTime start = date.atTime(Optional.ofNullable(from).orElse(LocalTime.MIN));
        LocalDateTime end = date.atTime(Optional.ofNullable(to).orElse(LocalTime.MAX));

        var rows = repository.findActive();
        Map<String, List<BusyWindowDto>> busyByDriver = new HashMap<>();

        for (var r : rows) {
            var window = buildWindow(r, date);
            if (window == null) continue;
            if (!overlaps(window, start, end)) continue;
            String key = driverKey(r);
            if (key.isBlank()) continue;
            busyByDriver.computeIfAbsent(key, k -> new ArrayList<>()).add(window);
        }

        return busyByDriver.entrySet().stream()
                .map(e -> {
                    var windows = sortWindows(e.getValue());
                    String name = windows.isEmpty() ? nameFromKey(e.getKey()) : Optional.ofNullable(windows.get(0).getDriverName()).orElse(nameFromKey(e.getKey()));
                    return DriverAvailabilityDto.builder()
                            .driverId(parseLongOrNull(e.getKey()))
                            .driverName(name)
                            .driverPhone(null)
                            .busy(windows)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<VehicleAvailabilityDto> vehicleAvailability(LocalDate date, LocalTime from, LocalTime to) {
        LocalDateTime start = date.atTime(Optional.ofNullable(from).orElse(LocalTime.MIN));
        LocalDateTime end = date.atTime(Optional.ofNullable(to).orElse(LocalTime.MAX));

        var rows = repository.findActive();
        Map<String, List<BusyWindowDto>> busyByVehicle = new HashMap<>();

        for (var r : rows) {
            var window = buildWindow(r, date);
            if (window == null) continue;
            if (!overlaps(window, start, end)) continue;
            String key = vehicleKey(r);
            if (key.isBlank()) continue;
            busyByVehicle.computeIfAbsent(key, k -> new ArrayList<>()).add(window);
        }

        return busyByVehicle.entrySet().stream()
                .map(e -> VehicleAvailabilityDto.builder()
                        .vehicleId(null)
                        .vehicleNumber(e.getKey())
                        .vehicleType(null)
                        .busy(sortWindows(e.getValue()))
                        .build())
                .collect(Collectors.toList());
    }

    private BusyWindowDto buildWindow(UsageRequestAvailabilityRepository.UsageRow r, LocalDate fallbackDate) {
        LocalDateTime from = r.getScheduledPickupAt();
        LocalDateTime to = r.getScheduledReturnAt();

        if (from == null && r.getDateOfTravel() != null) {
            var baseDate = r.getDateOfTravel();
            var tf = safeTime(r.getTimeFrom());
            from = baseDate.atTime(tf.orElse(LocalTime.of(0, 0)));
        }
        if (to == null && r.getDateOfTravel() != null) {
            var baseDate = r.getDateOfTravel();
            var tt = safeTime(r.getTimeTo());
            to = baseDate.atTime(tt.orElse(LocalTime.of(23, 59)));
        }
        if (from == null) {
            from = fallbackDate.atStartOfDay();
        }
        if (to == null) {
            to = from.plusHours(2);
        }
        return BusyWindowDto.builder()
                .from(from)
                .to(to)
                .requestCode(r.getRequestCode())
                .vehicleNumber(r.getVehicleNumber())
                .driverName(r.getDriverName())
                .status(r.getStatus())
                .build();
    }

    private boolean overlaps(BusyWindowDto window, LocalDateTime start, LocalDateTime end) {
        return !window.getFrom().isAfter(end) && !window.getTo().isBefore(start);
    }

    private Optional<LocalTime> safeTime(String text) {
        if (text == null || text.isBlank()) return Optional.empty();
        try {
            var t = text.length() == 5 ? text + ":00" : text;
            return Optional.of(LocalTime.parse(t));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String driverKey(UsageRequestAvailabilityRepository.UsageRow r) {
        if (r.getDriverId() != null) return String.valueOf(r.getDriverId());
        return Optional.ofNullable(r.getDriverName()).orElse("").trim();
    }

    private String vehicleKey(UsageRequestAvailabilityRepository.UsageRow r) {
        if (r.getVehicleId() != null) return String.valueOf(r.getVehicleId());
        return Optional.ofNullable(r.getVehicleNumber()).orElse("").trim().toUpperCase(Locale.ROOT);
    }

    private String nameFromKey(String key) {
        return key;
    }

    private Long parseLongOrNull(String val) {
        try {
            return Long.parseLong(val);
        } catch (Exception e) {
            return null;
        }
    }

    private List<BusyWindowDto> sortWindows(List<BusyWindowDto> list) {
        list.sort(Comparator.comparing(BusyWindowDto::getFrom));
        return list;
    }
}
