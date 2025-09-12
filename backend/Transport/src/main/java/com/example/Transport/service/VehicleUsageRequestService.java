package com.example.Transport.service;

import com.example.Transport.entity.GateLog;
import com.example.Transport.entity.VehicleAssignment;
import com.example.Transport.entity.VehicleUsageRequest;
import com.example.Transport.enums.RequestStatus;
import com.example.Transport.exception.BusinessException;
import com.example.Transport.repository.GateLogRepository;
import com.example.Transport.repository.VehicleAssignmentRepository;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.repository.VehicleUsageRequestRepository;
import com.example.Transport.util.HistoryRecorder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VehicleUsageRequestService {

    private final VehicleUsageRequestRepository reqRepo;
    private final VehicleAssignmentRepository assignRepo;
    private final GateLogRepository gateRepo;
    private final HistoryRecorder history;

    // ---------- Create / Read ----------
    public VehicleUsageRequest create(VehicleUsageRequest req, String actor) {
        req.setId(null);
        req.setStatus(RequestStatus.PENDING_HOD);
        req.setRequestCode(makeCode());
        var saved = reqRepo.save(req);
        history.record("UsageRequest", saved.getId().toString(), "Created", null, saved, actor);
        return saved;
    }

    public VehicleUsageRequest get(Long id) {
        return reqRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    public List<VehicleUsageRequest> listAll() {
        return reqRepo.findAll().stream()
                .sorted(Comparator.comparing(VehicleUsageRequest::getCreatedAt).reversed())
                .toList();
    }

    private String makeCode() {
        var y = Calendar.getInstance().get(Calendar.YEAR);
        return "VR-" + y + "-" + String.format("%04d", Math.max(1, (int) (reqRepo.count() + 1)));
    }

    // ---------- Approvals ----------
    @Transactional
    public VehicleUsageRequest hodDecision(Long id, boolean approve, String remarks, String actor) {
        var before = get(id);
        if (before.getStatus() != RequestStatus.PENDING_HOD) throw new BusinessException("Not in HOD stage");
        var after = copy(before);
        if (approve) {
            after.setStatus(RequestStatus.PENDING_MANAGEMENT);
            after.setHodBy(actor); after.setHodAt(new Date()); after.setHodRemarks(remarks);
        } else {
            after.setStatus(RequestStatus.REJECTED);
            after.setHodBy(actor); after.setHodAt(new Date()); after.setHodRemarks(remarks);
        }
        var saved = reqRepo.save(after);
        history.record("UsageRequest", saved.getId().toString(), approve ? "HOD_APPROVE" : "HOD_REJECT", before, saved, actor);
        return saved;
    }

    @Transactional
    public VehicleUsageRequest managementDecision(Long id, boolean approve, String remarks, String actor) {
        var before = get(id);
        if (before.getStatus() != RequestStatus.PENDING_MANAGEMENT) throw new BusinessException("Not in MANAGEMENT stage");
        var after = copy(before);
        after.setManagementBy(actor); after.setManagementAt(new Date()); after.setManagementRemarks(remarks);
        after.setStatus(approve ? RequestStatus.APPROVED : RequestStatus.REJECTED);
        var saved = reqRepo.save(after);
        history.record("UsageRequest", saved.getId().toString(), approve ? "MGMT_APPROVE" : "MGMT_REJECT", before, saved, actor);
        return saved;
    }

    // ---------- Assignment ----------
    @Transactional
    public VehicleUsageRequest assign(Long id, VehicleAssignment payload, String actor) {
        var before = get(id);
        if (before.getStatus() != RequestStatus.APPROVED) throw new BusinessException("Request not approved yet");
        payload.setId(null);
        payload.setRequestId(id);
        payload.setAssignedAt(new Date());
        payload.setAssignedBy(actor);
        var assign = assignRepo.save(payload);

        var after = copy(before);
        after.setStatus(RequestStatus.SCHEDULED);
        after.setAssignedVehicleId(assign.getVehicleId());
        after.setAssignedVehicleNumber(assign.getVehicleNumber());
        after.setAssignedDriverId(assign.getDriverId());
        after.setAssignedDriverName(assign.getDriverName());
        after.setAssignedDriverPhone(assign.getDriverPhone());
        after.setScheduledPickupAt(assign.getPickupAt());
        after.setScheduledReturnAt(assign.getExpectedReturnAt());
        after.setSpecialInstructions(assign.getInstructions());
        var saved = reqRepo.save(after);

        history.record("UsageRequest", id.toString(), "ASSIGNED", before, saved, actor);
        return saved;
    }

    // ---------- Gate logging ----------
    @Transactional
    public VehicleUsageRequest gateExit(Long id, String actor, Long exitOdometerKm) {
        var before = get(id);
        if (before.getStatus() != RequestStatus.SCHEDULED) throw new BusinessException("Trip not scheduled");

        var after = copy(before);
        after.setStatus(RequestStatus.DISPATCHED);
        after.setGateExitAt(new Date());
        after.setExitOdometerKm(exitOdometerKm);
        var saved = reqRepo.save(after);

        var gl = gateRepo.findByRequestId(id).orElse(GateLog.builder().requestId(id).build());
        gl.setExitAt(after.getGateExitAt()); gl.setExitBy(actor);
        gateRepo.save(gl);

        history.record("UsageRequest", id.toString(), "GATE_EXIT", before, saved, actor);
        return saved;
    }

    // Backward-compatible overload (no odometer provided)
    @Transactional
    public VehicleUsageRequest gateExit(Long id, String actor) {
        return gateExit(id, actor, null);
    }

    @Transactional
    public VehicleUsageRequest gateEntry(Long id, String actor, Long entryOdometerKm, VehicleRepository vehicleRepo) {
        var before = get(id);
        if (before.getStatus() != RequestStatus.DISPATCHED) throw new BusinessException("Trip not departed");

        var after = copy(before);
        after.setStatus(RequestStatus.RETURNED);
        after.setGateEntryAt(new Date());
        after.setEntryOdometerKm(entryOdometerKm);

        // compute metrics
        if (after.getExitOdometerKm() != null && entryOdometerKm != null) {
            long km = Math.max(0L, entryOdometerKm - after.getExitOdometerKm());
            after.setKmTraveled(km);
        }
        if (after.getGateExitAt() != null && after.getGateEntryAt() != null) {
            double hours = (after.getGateEntryAt().getTime() - after.getGateExitAt().getTime()) / 3600000.0;
            after.setHoursUsed(Math.max(0.0, hours));
        }

        var saved = reqRepo.save(after);

        // update or create GateLog for entry
        var gl = gateRepo.findByRequestId(id).orElse(GateLog.builder().requestId(id).build());
        gl.setEntryAt(after.getGateEntryAt()); gl.setEntryBy(actor);
        gateRepo.save(gl);

        // bump Vehicle.totalKmDriven (if repo provided and assignment exists)
        if (vehicleRepo != null && saved.getAssignedVehicleId() != null && saved.getKmTraveled() != null) {
            vehicleRepo.findById(saved.getAssignedVehicleId()).ifPresent(v -> {
                long base = (v.getTotalKmDriven() == null ? 0L : v.getTotalKmDriven());
                v.setTotalKmDriven(base + saved.getKmTraveled());
                vehicleRepo.save(v);
            });
        }

        history.record("UsageRequest", id.toString(), "GATE_ENTRY", before, saved, actor);
        return saved;
    }

    // Backward-compatible overloads
    @Transactional
    public VehicleUsageRequest gateEntry(Long id, String actor, VehicleRepository vehicleRepo) {
        return gateEntry(id, actor, null, vehicleRepo);
    }
    @Transactional
    public VehicleUsageRequest gateEntry(Long id, String actor) {
        return gateEntry(id, actor, null, null);
    }

    // ---------- Queries for pages ----------
    public List<VehicleUsageRequest> listByStatus(RequestStatus s) {
        return reqRepo.findByStatusOrderByCreatedAtDesc(s);
    }
    public List<VehicleUsageRequest> scheduledFor(LocalDate d) {
        return reqRepo.findByDateOfTravel(d);
    }

    private VehicleUsageRequest copy(VehicleUsageRequest x) {
        return VehicleUsageRequest.builder()
                .id(x.getId())
                .requestCode(x.getRequestCode())
                .applicantName(x.getApplicantName())
                .employeeId(x.getEmployeeId())
                .department(x.getDepartment())
                .travelOfficerName(x.getTravelOfficerName())
                .dateOfTravel(x.getDateOfTravel())
                .timeFrom(x.getTimeFrom())
                .timeTo(x.getTimeTo())
                .fromLocation(x.getFromLocation())
                .toLocation(x.getToLocation())
                .officialDescription(x.getOfficialDescription())
                .goods(x.getGoods())
                .status(x.getStatus())
                .hodBy(x.getHodBy()).hodAt(x.getHodAt()).hodRemarks(x.getHodRemarks())
                .managementBy(x.getManagementBy()).managementAt(x.getManagementAt()).managementRemarks(x.getManagementRemarks())
                .assignedVehicleId(x.getAssignedVehicleId()).assignedVehicleNumber(x.getAssignedVehicleNumber())
                .assignedDriverId(x.getAssignedDriverId()).assignedDriverName(x.getAssignedDriverName()).assignedDriverPhone(x.getAssignedDriverPhone())
                .scheduledPickupAt(x.getScheduledPickupAt()).scheduledReturnAt(x.getScheduledReturnAt())
                .specialInstructions(x.getSpecialInstructions())
                .gateExitAt(x.getGateExitAt()).gateEntryAt(x.getGateEntryAt())
                .exitOdometerKm(x.getExitOdometerKm()).entryOdometerKm(x.getEntryOdometerKm())
                .kmTraveled(x.getKmTraveled()).hoursUsed(x.getHoursUsed())
                .createdAt(x.getCreatedAt()).createdBy(x.getCreatedBy())
                .updatedAt(x.getUpdatedAt()).updatedBy(x.getUpdatedBy())
                .deletedBy(x.getDeletedBy()).deletedAt(x.getDeletedAt())
                .build();
    }
}
