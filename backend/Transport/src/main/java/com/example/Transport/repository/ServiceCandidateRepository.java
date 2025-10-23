package com.example.Transport.repository;

import com.example.Transport.entity.ServiceCandidate;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.ServiceCandidateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ServiceCandidateRepository extends JpaRepository<ServiceCandidate, Long> {

    @EntityGraph(attributePaths = {"vehicle"}) // eager-load vehicle to avoid lazy-init issues
    @Query("""
       SELECT sc FROM ServiceCandidate sc
       WHERE (:status IS NULL OR sc.status = :status)
       ORDER BY sc.createdAt DESC
    """)
    Page<ServiceCandidate> findByStatus(@Param("status") ServiceCandidateStatus status, Pageable pageable);

    @Query("""
        SELECT sc FROM ServiceCandidate sc
        WHERE sc.vehicle = :vehicle AND sc.status = 'ACTIVE'
    """)
    Optional<ServiceCandidate> findActiveByVehicle(@Param("vehicle") Vehicle vehicle);

    boolean existsByVehicle_IdAndStatus(Long vehicleId, ServiceCandidateStatus status);
}
