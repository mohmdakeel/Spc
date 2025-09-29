package com.example.Transport.service;

import com.example.Transport.entity.ServiceCandidate;
import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import com.example.Transport.repository.ServiceCandidateRepository;
import com.example.Transport.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OdometerScanService {

    private final VehicleRepository vehicleRepository;
    private final ServiceCandidateRepository candidateRepository;

    /** interval=5000, window=100 as requested */
    @Transactional
    public List<ServiceCandidate> populateAutoOdometer(String actor) {
        long interval = 5000, window = 100;
        var dueVehicles = vehicleRepository.findDueByOdometer(interval, window);

        return dueVehicles.stream()
                .filter(v -> !candidateRepository.existsByVehicle_IdAndStatus(v.getId(), ServiceCandidateStatus.ACTIVE))
                .map(v -> candidateRepository.save(
                        ServiceCandidate.builder()
                                .vehicle(v)
                                .source(ServiceCandidateSource.AUTO_ODOMETER)
                                .status(ServiceCandidateStatus.ACTIVE)
                                .reason(interval + "km interval")
                                .notes("Auto-detected within " + window + "km of service interval")
                                .createdBy(actor == null ? "system" : actor)
                                .build()
                ))
                .toList();
    }
}
