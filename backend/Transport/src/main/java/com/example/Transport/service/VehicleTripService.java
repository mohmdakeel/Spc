package com.example.Transport.service;

import com.example.Transport.entity.VehicleTrip;
import com.example.Transport.entity.VehicleUsageRequest;
import com.example.Transport.enums.RequestStatus;
import com.example.Transport.enums.TripStatus;
import com.example.Transport.exception.BusinessException;
import com.example.Transport.repository.GateLogRepository;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.repository.VehicleTripRepository;
import com.example.Transport.repository.VehicleUsageRequestRepository;
import com.example.Transport.util.HistoryRecorder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class VehicleTripService {

    private final VehicleTripRepository tripRepo;
    private final VehicleUsageRequestRepository reqRepo;
    private final VehicleRepository vehicleRepo;
    private final GateLogRepository gateRepo;
    private final HistoryRecorder history;

    private String makeCode() {
        var y = Calendar.getInstance().get(Calendar.YEAR);
        long n = Math.max(1, tripRepo.count() + 1);
        return "TR-" + y + "-" + String.format("%04d", n);
    }

    // ===== Create trip from 1..N approved requests =====
    @Transactional
    public VehicleTrip createTrip(String actor,
                                  List<Long> requestIds,
                                  Long vehicleId, String vehicleNumber,
                                  Long driverId, String driverName, String driverPhone,
                                  Date pickupAt, Date expectedReturnAt, String instructions) {

        if (requestIds == null || requestIds.isEmpty()) throw new IllegalArgumentException("No requests selected");
        var requests = reqRepo.findAllById(requestIds);
        if (requests.size() != requestIds.size()) throw new BusinessException("Some requests not found");

        // Validate all are approved and not already pooled
        for (var r : requests) {
            if (r.getStatus() != RequestStatus.APPROVED) {
                throw new BusinessException("Request " + r.getRequestCode() + " is not APPROVED");
            }
            if (r.getTripId() != null) {
                throw new BusinessException("Request " + r.getRequestCode() + " already assigned to a trip");
            }
        }

        // Create trip
        var trip = VehicleTrip.builder()
                .tripCode(makeCode())
                .status(TripStatus.SCHEDULED)
                .vehicleId(vehicleId).vehicleNumber(vehicleNumber)
                .driverId(driverId).driverName(driverName).driverPhone(driverPhone)
                .pickupAt(pickupAt).expectedReturnAt(expectedReturnAt)
                .instructions(instructions)
                .createdBy(actor).updatedBy(actor)
                .build();
        trip = tripRepo.save(trip);

        // Attach requests & update their quick-view fields
        for (var r : requests) {
            r.setTripId(trip.getId());
            r.setStatus(RequestStatus.SCHEDULED);
            r.setAssignedVehicleId(vehicleId); r.setAssignedVehicleNumber(vehicleNumber);
            r.setAssignedDriverId(driverId);   r.setAssignedDriverName(driverName); r.setAssignedDriverPhone(driverPhone);
            r.setScheduledPickupAt(pickupAt);  r.setScheduledReturnAt(expectedReturnAt);
            r.setSpecialInstructions(instructions);
            r.setUpdatedBy(actor);
            reqRepo.save(r);
            history.record("UsageRequest", r.getId().toString(), "ASSIGNED_TRIP#" + trip.getTripCode(), null, r, actor);
        }

        history.record("Trip", trip.getId().toString(), "CREATED", null, trip, actor);
        return trip;
    }

    @Transactional
    public VehicleTrip addRequestToTrip(Long tripId, Long requestId, String actor) {
        var trip = tripRepo.findById(tripId).orElseThrow(() -> new BusinessException("Trip not found"));
        if (trip.getStatus() != TripStatus.SCHEDULED) throw new BusinessException("Trip not in SCHEDULED stage");

        var r = reqRepo.findById(requestId).orElseThrow(() -> new BusinessException("Request not found"));
        if (r.getStatus() != RequestStatus.APPROVED) throw new BusinessException("Request not APPROVED");
        if (r.getTripId() != null) throw new BusinessException("Request already assigned to trip");

        r.setTripId(tripId);
        r.setStatus(RequestStatus.SCHEDULED);
        r.setAssignedVehicleId(trip.getVehicleId()); r.setAssignedVehicleNumber(trip.getVehicleNumber());
        r.setAssignedDriverId(trip.getDriverId());   r.setAssignedDriverName(trip.getDriverName()); r.setAssignedDriverPhone(trip.getDriverPhone());
        r.setScheduledPickupAt(trip.getPickupAt());  r.setScheduledReturnAt(trip.getExpectedReturnAt());
        r.setUpdatedBy(actor);
        reqRepo.save(r);

        history.record("UsageRequest", r.getId().toString(), "ADDED_TO_TRIP#" + trip.getTripCode(), null, r, actor);
        return trip;
    }

    @Transactional
    public VehicleTrip removeRequestFromTrip(Long tripId, Long requestId, String actor) {
        var trip = tripRepo.findById(tripId).orElseThrow(() -> new BusinessException("Trip not found"));
        if (trip.getStatus() != TripStatus.SCHEDULED) throw new BusinessException("Trip already started");

        var r = reqRepo.findById(requestId).orElseThrow(() -> new BusinessException("Request not found"));
        if (!Objects.equals(r.getTripId(), tripId)) throw new BusinessException("Request not in this trip");

        r.setTripId(null);
        r.setStatus(RequestStatus.APPROVED);
        r.setAssignedVehicleId(null); r.setAssignedVehicleNumber(null);
        r.setAssignedDriverId(null);  r.setAssignedDriverName(null); r.setAssignedDriverPhone(null);
        r.setScheduledPickupAt(null); r.setScheduledReturnAt(null);
        r.setUpdatedBy(actor);
        reqRepo.save(r);

        history.record("UsageRequest", r.getId().toString(), "REMOVED_FROM_TRIP#" + trip.getTripCode(), null, r, actor);
        return trip;
    }

    // ===== Gate operations at trip level (propagate to requests) =====

    @Transactional
    public VehicleTrip gateExitTrip(Long tripId, String actor, Long exitOdoKm) {
        var trip = tripRepo.findById(tripId).orElseThrow(() -> new BusinessException("Trip not found"));
        if (trip.getStatus() != TripStatus.SCHEDULED) throw new BusinessException("Trip not scheduled");

        trip.setStatus(TripStatus.DISPATCHED);
        trip.setGateExitAt(new Date());
        trip.setExitOdometerKm(exitOdoKm);
        trip.setUpdatedBy(actor);
        var savedTrip = tripRepo.save(trip);

        // Update each request attached to trip
        reqRepo.findAll().stream()
                .filter(r -> Objects.equals(r.getTripId(), tripId))
                .forEach(r -> {
                    r.setStatus(RequestStatus.DISPATCHED);
                    r.setGateExitAt(savedTrip.getGateExitAt());
                    r.setExitOdometerKm(exitOdoKm);
                    r.setUpdatedBy(actor);
                    reqRepo.save(r);
                });

        history.record("Trip", tripId.toString(), "GATE_EXIT", null, savedTrip, actor);
        return savedTrip;
    }

    @Transactional
    public VehicleTrip gateEntryTrip(Long tripId, String actor, Long entryOdoKm) {
        var trip = tripRepo.findById(tripId).orElseThrow(() -> new BusinessException("Trip not found"));
        if (trip.getStatus() != TripStatus.DISPATCHED) throw new BusinessException("Trip not departed");

        trip.setStatus(TripStatus.RETURNED);
        trip.setGateEntryAt(new Date());
        trip.setEntryOdometerKm(entryOdoKm);

        if (trip.getExitOdometerKm() != null && entryOdoKm != null) {
            long km = Math.max(0L, entryOdoKm - trip.getExitOdometerKm());
            trip.setKmTraveled(km);
        }
        if (trip.getGateExitAt() != null && trip.getGateEntryAt() != null) {
            double hrs = (trip.getGateEntryAt().getTime() - trip.getGateExitAt().getTime()) / 3600000.0;
            trip.setHoursUsed(Math.max(0.0, hrs));
        }
        trip.setUpdatedBy(actor);
        var savedTrip = tripRepo.save(trip);

        // Propagate to requests + update vehicle total Km
        long kmDelta = savedTrip.getKmTraveled() == null ? 0L : savedTrip.getKmTraveled();

        reqRepo.findAll().stream()
                .filter(r -> Objects.equals(r.getTripId(), tripId))
                .forEach(r -> {
                    r.setStatus(RequestStatus.RETURNED);
                    r.setGateEntryAt(savedTrip.getGateEntryAt());
                    r.setEntryOdometerKm(entryOdoKm);
                    r.setKmTraveled(savedTrip.getKmTraveled());
                    r.setHoursUsed(savedTrip.getHoursUsed());
                    r.setUpdatedBy(actor);
                    reqRepo.save(r);
                });

        if (savedTrip.getVehicleId() != null && kmDelta > 0) {
            vehicleRepo.findById(savedTrip.getVehicleId()).ifPresent(v -> {
                long base = v.getTotalKmDriven() == null ? 0L : v.getTotalKmDriven();
                v.setTotalKmDriven(base + kmDelta);
                vehicleRepo.save(v);
            });
        }

        history.record("Trip", tripId.toString(), "GATE_ENTRY", null, savedTrip, actor);
        return savedTrip;
    }

    // ===== Availability =====

    public Map<String, Object> availability(Date from, Date to) {
        var active = List.of(TripStatus.SCHEDULED, TripStatus.DISPATCHED);
        var overlaps = tripRepo.findByStatusInAndPickupAtLessThanAndExpectedReturnAtGreaterThan(active, to, from);

        // vehicleId -> count of overlapping trips
        Map<Long, Integer> vehicleBusy = new HashMap<>();
        for (var t : overlaps) {
            if (t.getVehicleId() == null) continue;
            vehicleBusy.put(t.getVehicleId(), vehicleBusy.getOrDefault(t.getVehicleId(), 0) + 1);
        }

        // driverId -> count
        Map<Long, Integer> driverBusy = new HashMap<>();
        for (var t : overlaps) {
            if (t.getDriverId() == null) continue;
            driverBusy.put(t.getDriverId(), driverBusy.getOrDefault(t.getDriverId(), 0) + 1);
        }

        return Map.of("vehiclesBusy", vehicleBusy, "driversBusy", driverBusy, "trips", overlaps);
    }
}
