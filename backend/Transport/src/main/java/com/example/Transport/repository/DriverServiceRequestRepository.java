package com.example.Transport.repository;

import com.example.Transport.entity.DriverServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DriverServiceRequestRepository extends JpaRepository<DriverServiceRequest, Long> {

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    @Query("select r from DriverServiceRequest r")
    Page<DriverServiceRequest> findAllWithGraph(Pageable pageable);

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    @Query("select r from DriverServiceRequest r where r.id = :id")
    Optional<DriverServiceRequest> findByIdWithGraph(@Param("id") Long id);

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    Page<DriverServiceRequest> findByEpfOrderByCreatedAtDesc(String epf, Pageable pageable);

    // Helpers for queries
    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    List<DriverServiceRequest> findByEpf(String epf);

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    List<DriverServiceRequest> findByVehicle_VehicleNumber(String vehicleNumber);

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    List<DriverServiceRequest> findByEpfAndVehicle_VehicleNumber(String epf, String vehicleNumber);
}
