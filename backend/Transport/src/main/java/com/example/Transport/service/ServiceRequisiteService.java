package com.example.Transport.service;

import com.example.Transport.dto.ServiceRequisiteDtos;
import com.example.Transport.entity.ServiceRequisite;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.Department;
import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import com.example.Transport.enums.Urgency;
import com.example.Transport.repository.ServiceCandidateRepository;
import com.example.Transport.repository.ServiceRequisiteRepository;
import com.example.Transport.util.HistoryRecorder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ServiceRequisiteService {

    private final ServiceRequisiteRepository srRepo;
    private final ServiceCandidateService candidateService;
    private final ServiceCandidateRepository candidateRepo;
    private final HistoryRecorder history;

    @Transactional
    public ServiceRequisiteDtos.Response createFromDsr(
            com.example.Transport.entity.DriverServiceRequest dsr,
            Vehicle vehicle,
            ServiceRequisiteDtos.HrApproveRequest req,
            String actor
    ) {
        var existing = srRepo.findByDriverServiceRequestId(dsr.getId()).orElse(null);
        if (existing != null) return toDto(existing);

        var sr = ServiceRequisite.builder()
                .driverServiceRequestId(dsr.getId())
                .approvedDate(new Date())
                .section("Transport")
                .vehicleNumber(dsr.getVehicleNumber())
                .vehicleType(vehicle.getVehicleType())
                .servicesNeeded(dsr.getServicesNeeded() == null ? List.of() : dsr.getServicesNeeded())
                .extraServices(req != null && req.getExtraServices() != null ? req.getExtraServices() : List.of())
                .urgency(req != null && req.getUrgency() != null ? req.getUrgency() : Urgency.NORMAL)
                .approvalByDepartment(req != null && req.getApprovalByDepartment() != null ? req.getApprovalByDepartment() : Department.NONE)
                .departmentApprovalStatus("PENDING")
                .requiredByDate(req != null ? req.getRequiredByDate() : null)
                .createdBy(actor == null ? "system" : actor)
                .build();

        var saved = srRepo.save(sr);

        // 🔹 Record history: HR_APPROVE / CREATE
        history.record("ServiceRequisite", String.valueOf(saved.getId()), "CREATE_FROM_DSR", null, saved, actor);

        boolean exists = candidateRepo.existsByVehicle_IdAndStatus(vehicle.getId(), ServiceCandidateStatus.ACTIVE);
        if (!exists) {
            var candidate = candidateRepo.save(
                    com.example.Transport.entity.ServiceCandidate.builder()
                            .vehicle(vehicle)
                            .source(ServiceCandidateSource.HR_REQUEST)
                            .status(ServiceCandidateStatus.ACTIVE)
                            .reason("HR approved DSR #" + dsr.getId())
                            .notes("Auto-added on HR approval")
                            .createdBy(actor == null ? "system" : actor)
                            .build()
            );
            history.record("ServiceCandidate", String.valueOf(candidate.getId()), "AUTO_CREATE_FROM_SR", null, candidate, actor);
        }

        return toDto(saved);
    }

    private ServiceRequisiteDtos.Response toDto(ServiceRequisite s) {
        return ServiceRequisiteDtos.Response.builder()
                .id(s.getId())
                .driverServiceRequestId(s.getDriverServiceRequestId())
                .approvedDate(s.getApprovedDate())
                .section(s.getSection())
                .vehicleNumber(s.getVehicleNumber())
                .vehicleType(s.getVehicleType())
                .servicesNeeded(s.getServicesNeeded())
                .extraServices(s.getExtraServices())
                .urgency(s.getUrgency())
                .approvalByDepartment(s.getApprovalByDepartment())
                .departmentApprovalStatus(s.getDepartmentApprovalStatus())
                .requiredByDate(s.getRequiredByDate())
                .createdBy(s.getCreatedBy())
                .createdAt(s.getCreatedAt())
                .updatedBy(s.getUpdatedBy())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
