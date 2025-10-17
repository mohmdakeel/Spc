package com.example.Transport.service;

import com.example.Transport.dto.ServiceCandidateDtos;
import com.example.Transport.entity.ServiceCandidate;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import com.example.Transport.exception.BadRequestException;
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
public class ServiceCandidateService {

    private final ServiceCandidateRepository candidateRepo;
    private final VehicleRepository vehicleRepo;
    private final HistoryRecorder history;

    /** List ACTIVE by default */
    public Page<ServiceCandidateDtos.Response> list(ServiceCandidateStatus status, int page, int size) {
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var res = candidateRepo.findByStatus(status == null ? ServiceCandidateStatus.ACTIVE : status, p)
                .map(this::toDto);
        return res;
    }

    @Transactional
    public ServiceCandidateDtos.Response addFromDriver(ServiceCandidateDtos.CreateRequest req, String actor) {
        var dto = createCandidate(req, ServiceCandidateSource.DRIVER_REQUEST, actor);
        history.record("ServiceCandidate", String.valueOf(dto.getId()), "CREATE_DRIVER", null, dto, actor);
        return dto;
    }

    @Transactional
    public ServiceCandidateDtos.Response addFromHR(ServiceCandidateDtos.CreateRequest req, String actor) {
        var dto = createCandidate(req, ServiceCandidateSource.HR_REQUEST, actor);
        history.record("ServiceCandidate", String.valueOf(dto.getId()), "CREATE_HR", null, dto, actor);
        return dto;
    }

    @Transactional
    public List<ServiceCandidateDtos.Response> autoDetectDueByOdometer(int intervalKm, int windowKm, String actor) {
        var vehicles = vehicleRepo.findByIsDeleted(0, Pageable.unpaged()).getContent();

        return vehicles.stream()
                .filter(v -> isDueByOdometer(v, intervalKm, windowKm))
                .filter(v -> !candidateRepo.existsByVehicle_IdAndStatus(v.getId(), ServiceCandidateStatus.ACTIVE))
                .map(v -> {
                    var sc = ServiceCandidate.builder()
                            .vehicle(v)
                            .source(ServiceCandidateSource.AUTO_ODOMETER)
                            .status(ServiceCandidateStatus.ACTIVE)
                            .reason(intervalKm + "km interval")
                            .notes("Auto-detected by odometer rule")
                            .createdBy(actor == null ? "system" : actor)
                            .build();
                    var saved = candidateRepo.save(sc);
                    history.record("ServiceCandidate", String.valueOf(saved.getId()), "AUTO_CREATE", null, saved, actor);
                    return toDto(saved);
                })
                .toList();
    }

    private boolean isDueByOdometer(Vehicle v, int intervalKm, int windowKm) {
        if (v.getTotalKmDriven() == null) return false;
        long km = v.getTotalKmDriven();
        long mod = km % intervalKm;
        return mod <= windowKm || mod >= (intervalKm - windowKm);
    }

    @Transactional
    public ServiceCandidateDtos.Response updateStatus(Long id, ServiceCandidateDtos.UpdateStatusRequest req, String actor) {
        var sc = candidateRepo.findById(id)
                .orElseThrow(() -> new BadRequestException("ServiceCandidate not found: " + id));
        var before = ServiceCandidate.builder()
                .id(sc.getId())
                .vehicle(sc.getVehicle())
                .status(sc.getStatus())
                .source(sc.getSource())
                .reason(sc.getReason())
                .notes(sc.getNotes())
                .build();

        sc.setStatus(req.getStatus());
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            sc.setNotes((sc.getNotes() == null ? "" : sc.getNotes() + "\n") + req.getNotes());
        }
        sc.setUpdatedBy(actor == null ? "system" : actor);
        var saved = candidateRepo.save(sc);

        history.record("ServiceCandidate", String.valueOf(id), "UPDATE_STATUS", before, saved, actor);

        return toDto(saved);
    }

    private ServiceCandidateDtos.Response toDto(ServiceCandidate sc) {
        return ServiceCandidateDtos.Response.builder()
                .id(sc.getId())
                .vehicleId(sc.getVehicle().getId())
                .vehicleNumber(sc.getVehicle().getVehicleNumber())
                .source(sc.getSource())
                .status(sc.getStatus())
                .reason(sc.getReason())
                .notes(sc.getNotes())
                .createdBy(sc.getCreatedBy())
                .createdAt(sc.getCreatedAt())
                .updatedBy(sc.getUpdatedBy())
                .updatedAt(sc.getUpdatedAt())
                .build();
    }

    private ServiceCandidateDtos.Response createCandidate(ServiceCandidateDtos.CreateRequest req,
                                                          ServiceCandidateSource forcedSource,
                                                          String actor) {
        var v = vehicleRepo.findById(req.getVehicleId())
                .orElseThrow(() -> new BadRequestException("Vehicle not found: id=" + req.getVehicleId()));
        if (v.getIsDeleted() != null && v.getIsDeleted() == 1) {
            throw new BadRequestException("Vehicle is deleted: " + v.getVehicleNumber());
        }
        candidateRepo.findActiveByVehicle(v).ifPresent(existing -> {
            throw new BadRequestException("Vehicle already has an ACTIVE service candidate: id=" + existing.getId());
        });

        var sc = ServiceCandidate.builder()
                .vehicle(v)
                .source(forcedSource != null ? forcedSource :
                        (req.getSource() == null ? ServiceCandidateSource.HR_REQUEST : req.getSource()))
                .status(ServiceCandidateStatus.ACTIVE)
                .reason(req.getReason())
                .notes(req.getNotes())
                .createdBy(actor == null ? "system" : actor)
                .build();

        var saved = candidateRepo.save(sc);
        return toDto(saved);
    }
}
