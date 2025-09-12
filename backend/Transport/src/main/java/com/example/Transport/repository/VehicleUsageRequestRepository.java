package com.example.Transport.repository;

import com.example.Transport.entity.VehicleUsageRequest;
import com.example.Transport.enums.RequestStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VehicleUsageRequestRepository extends JpaRepository<VehicleUsageRequest, Long> {
    List<VehicleUsageRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
    List<VehicleUsageRequest> findByDateOfTravel(LocalDate date);
    long countByStatus(RequestStatus status);

    List<VehicleUsageRequest> findByDepartmentAndStatusOrderByCreatedAtDesc(String department, RequestStatus status);

    // Convenience: allows multi-status dept filters while keeping interface usage simple
    default List<VehicleUsageRequest> findLatestByDeptAndStatuses(String department, List<RequestStatus> statuses) {
        return findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(r -> department.equalsIgnoreCase(r.getDepartment()))
                .filter(r -> statuses.contains(r.getStatus()))
                .toList();
    }
}
