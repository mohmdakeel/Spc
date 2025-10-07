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

    @Transactional(readOnly = true)
    public Page<DriverServiceRequestDtos.Response> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // IMPORTANT: use the graph so vehicle/servicesNeeded load
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
        var dsr = dsrRepo.findByIdWithGraph(id)
                .orElseThrow(() -> new BadRequestException("DriverServiceRequest not found: " + id));

        if (req.getServicesNeeded() != null) dsr.setServicesNeeded(req.getServicesNeeded());
        if (req.getLastServiceReadingKm() != null) dsr.setLastServiceReadingKm(req.getLastServiceReadingKm());
        if (req.getNextServiceReadingKm() != null) dsr.setNextServiceReadingKm(req.getNextServiceReadingKm());
        if (req.getCurrentReadingKm() != null) dsr.setCurrentReadingKm(req.getCurrentReadingKm());
        if (req.getAdviceByVehicleOfficer() != null) dsr.setAdviceByVehicleOfficer(req.getAdviceByVehicleOfficer());
        if (req.getAdviceByMechanic() != null) dsr.setAdviceByMechanic(req.getAdviceByMechanic());
        if (req.getHrApproval() != null) dsr.setHrApproval(req.getHrApproval());

        dsr.setUpdatedBy(actor == null ? "system" : actor);
        var saved = dsrRepo.save(dsr);

        // When HR APPROVES, ensure candidate exists (idempotent)
        if (req.getHrApproval() == HrApprovalStatus.APPROVED) {
            var v = dsr.getVehicle();
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
        if (!dsrRepo.existsById(id))
            throw new BadRequestException("DriverServiceRequest not found: " + id);
        dsrRepo.deleteById(id);
    }

    /* ===== Query helpers used by controller ===== */

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

    /* ===== mapper ===== */

    private DriverServiceRequestDtos.Response toDto(DriverServiceRequest r) {
        // (EntityGraph already loads relations; size() is defensive)
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
