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

@Service
@RequiredArgsConstructor
public class DriverServiceRequestService {

    private final DriverServiceRequestRepository dsrRepo;
    private final VehicleRepository vehicleRepo;
    private final ServiceCandidateRepository candidateRepo;

    public Page<DriverServiceRequestDtos.Response> list(int page, int size) {
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return dsrRepo.findAll(p).map(this::toDto);
    }

    public DriverServiceRequestDtos.Response get(Long id) {
        return dsrRepo.findById(id).map(this::toDto)
                .orElseThrow(() -> new BadRequestException("DriverServiceRequest not found: " + id));
    }

    @Transactional
    public DriverServiceRequestDtos.Response create(DriverServiceRequestDtos.CreateRequest req, String actor) {
        Vehicle v = vehicleRepo.findAll().stream()
                .filter(x -> x.getIsDeleted() == 0 && req.getVehicleNumber().equalsIgnoreCase(x.getVehicleNumber()))
                .findFirst()
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

        // Add ServiceCandidate if not already ACTIVE
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
        var dsr = dsrRepo.findById(id)
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
                        com.example.Transport.entity.ServiceCandidate.builder()
                                .vehicle(v)
                                .source(com.example.Transport.enums.ServiceCandidateSource.HR_REQUEST)
                                .status(com.example.Transport.enums.ServiceCandidateStatus.ACTIVE)
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
        // Hard delete is fine for requests (or you can soft-delete, your call)
        if (!dsrRepo.existsById(id)) throw new BadRequestException("DriverServiceRequest not found: " + id);
        dsrRepo.deleteById(id);
    }

    private DriverServiceRequestDtos.Response toDto(DriverServiceRequest r) {
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
