package com.example.Transport.service;

import com.example.Transport.dto.DriverServiceRequestDtos;
import com.example.Transport.entity.DriverServiceRequest;
import com.example.Transport.entity.ServiceCandidate;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.HrApprovalStatus;
import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import com.example.Transport.exception.BadRequestException;
import com.example.Transport.repository.DriverServiceRequestRepository;
import com.example.Transport.repository.ServiceCandidateRepository;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.util.HistoryRecorder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverServiceRequestService {

    private final DriverServiceRequestRepository dsrRepo;
    private final VehicleRepository vehicleRepo;
    private final ServiceCandidateRepository candidateRepo;
    private final HistoryRecorder history;

    @Transactional(readOnly = true)
    public Page<DriverServiceRequestDtos.Response> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DriverServiceRequest> requests = dsrRepo.findAllWithGraph(pageable);
        return requests.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public DriverServiceRequestDtos.Response get(Long id) {
        var r = dsrRepo.findByIdWithGraph(id)
                .orElseThrow(() -> new BadRequestException("DriverServiceRequest not found: " + id));
        return toDto(r);
    }

    @Transactional
    public DriverServiceRequestDtos.Response create(DriverServiceRequestDtos.CreateRequest req, String actor) {
        Vehicle v = vehicleRepo.findByVehicleNumberAndIsDeleted(req.getVehicleNumber(), 0)
                .orElseThrow(() -> new BadRequestException("Active vehicle not found: " + req.getVehicleNumber()));

        var dsr = DriverServiceRequest.builder()
                .vehicle(v)
                .vehicleNumber(v.getVehicleNumber())
                .driverName(req.getDriverName())
                .epf(req.getEpf())
                .requestDate(req.getRequestDate())
                .servicesNeeded(req.getServicesNeeded())
                .lastServiceReadingKm(req.getLastServiceReadingKm())
                .nextServiceReadingKm(req.getNextServiceReadingKm())
                .currentReadingKm(req.getCurrentReadingKm())
                .adviceByVehicleOfficer(req.getAdviceByVehicleOfficer())
                .adviceByMechanic(req.getAdviceByMechanic())
                .hrApproval(HrApprovalStatus.PENDING)
                .createdBy(actor == null ? "system" : actor)
                .build();

        var saved = dsrRepo.save(dsr);

        // 🔹 Record history: CREATE
        history.record("DriverServiceRequest", String.valueOf(saved.getId()), "CREATE", null, saved, actor);

        // Create ACTIVE ServiceCandidate if none exists
        boolean exists = candidateRepo.existsByVehicle_IdAndStatus(v.getId(), ServiceCandidateStatus.ACTIVE);
        if (!exists) {
            candidateRepo.save(
                    ServiceCandidate.builder()
                            .vehicle(v)
                            .source(ServiceCandidateSource.DRIVER_REQUEST)
                            .status(ServiceCandidateStatus.ACTIVE)
                            .reason("Driver Service Request #" + saved.getId())
                            .notes("Created from DSR by " + (actor == null ? "system" : actor))
                            .createdBy(actor == null ? "system" : actor)
                            .build()
            );
        }

        return toDto(saved);
    }

    @Transactional
    public DriverServiceRequestDtos.Response update(Long id, DriverServiceRequestDtos.UpdateRequest req, String actor) {
        var before = dsrRepo.findByIdWithGraph(id)
                .orElseThrow(() -> new BadRequestException("DriverServiceRequest not found: " + id));

        // Keep snapshot for history diff
        var snapshot = DriverServiceRequest.builder()
                .id(before.getId())
                .vehicle(before.getVehicle())
                .vehicleNumber(before.getVehicleNumber())
                .driverName(before.getDriverName())
                .epf(before.getEpf())
                .requestDate(before.getRequestDate())
                .servicesNeeded(before.getServicesNeeded())
                .lastServiceReadingKm(before.getLastServiceReadingKm())
                .nextServiceReadingKm(before.getNextServiceReadingKm())
                .currentReadingKm(before.getCurrentReadingKm())
                .adviceByVehicleOfficer(before.getAdviceByVehicleOfficer())
                .adviceByMechanic(before.getAdviceByMechanic())
                .hrApproval(before.getHrApproval())
                .createdAt(before.getCreatedAt())
                .createdBy(before.getCreatedBy())
                .build();

        // Apply updates
        if (req.getServicesNeeded() != null) before.setServicesNeeded(req.getServicesNeeded());
        if (req.getLastServiceReadingKm() != null) before.setLastServiceReadingKm(req.getLastServiceReadingKm());
        if (req.getNextServiceReadingKm() != null) before.setNextServiceReadingKm(req.getNextServiceReadingKm());
        if (req.getCurrentReadingKm() != null) before.setCurrentReadingKm(req.getCurrentReadingKm());
        if (req.getAdviceByVehicleOfficer() != null) before.setAdviceByVehicleOfficer(req.getAdviceByVehicleOfficer());
        if (req.getAdviceByMechanic() != null) before.setAdviceByMechanic(req.getAdviceByMechanic());
        if (req.getHrApproval() != null) before.setHrApproval(req.getHrApproval());

        before.setUpdatedBy(actor == null ? "system" : actor);
        var saved = dsrRepo.save(before);

        // 🔹 Record history: UPDATE
        history.record("DriverServiceRequest", String.valueOf(id), "UPDATE", snapshot, saved, actor);

        // HR approval hook
        if (req.getHrApproval() == HrApprovalStatus.APPROVED) {
            var v = before.getVehicle();
            boolean exists = candidateRepo.existsByVehicle_IdAndStatus(v.getId(), ServiceCandidateStatus.ACTIVE);
            if (!exists) {
                candidateRepo.save(
                        ServiceCandidate.builder()
                                .vehicle(v)
                                .source(ServiceCandidateSource.HR_REQUEST)
                                .status(ServiceCandidateStatus.ACTIVE)
                                .reason("HR approved DSR #" + saved.getId())
                                .notes("Auto-added on HR approval")
                                .createdBy(actor == null ? "system" : actor)
                                .build()
                );
            }
        }

        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        var before = dsrRepo.findById(id)
                .orElseThrow(() -> new BadRequestException("DriverServiceRequest not found: " + id));

        dsrRepo.delete(before);

        // 🔹 Record history: DELETE
        history.record("DriverServiceRequest", String.valueOf(id), "DELETE", before, null, "system");
    }

    /* ===== Query helpers ===== */

    @Transactional(readOnly = true)
    public List<DriverServiceRequestDtos.Response> getByEpf(String epf) {
        return dsrRepo.findByEpf(epf).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<DriverServiceRequestDtos.Response> getByVehicleNumber(String vehicleNumber) {
        return dsrRepo.findByVehicle_VehicleNumber(vehicleNumber).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<DriverServiceRequestDtos.Response> getByEpfAndVehicleNumber(String epf, String vehicleNumber) {
        return dsrRepo.findByEpfAndVehicle_VehicleNumber(epf, vehicleNumber).stream().map(this::toDto).toList();
    }

    private DriverServiceRequestDtos.Response toDto(DriverServiceRequest r) {
        if (r.getServicesNeeded() != null) r.getServicesNeeded().size();
        return DriverServiceRequestDtos.Response.builder()
                .id(r.getId())
                .vehicleId(r.getVehicle().getId())
                .vehicleNumber(r.getVehicleNumber())
                .driverName(r.getDriverName())
                .epf(r.getEpf())
                .requestDate(r.getRequestDate())
                .servicesNeeded(r.getServicesNeeded())
                .lastServiceReadingKm(r.getLastServiceReadingKm())
                .nextServiceReadingKm(r.getNextServiceReadingKm())
                .currentReadingKm(r.getCurrentReadingKm())
                .adviceByVehicleOfficer(r.getAdviceByVehicleOfficer())
                .adviceByMechanic(r.getAdviceByMechanic())
                .hrApproval(r.getHrApproval())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
