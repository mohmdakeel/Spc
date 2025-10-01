package com.example.Transport.repository;

import com.example.Transport.entity.DriverServiceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DriverServiceRequestRepository extends JpaRepository<DriverServiceRequest, Long> {

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    @Query("select r from DriverServiceRequest r")
    Page<DriverServiceRequest> findAllWithGraph(Pageable pageable);

    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    @Query("select r from DriverServiceRequest r where r.id = :id")
    Optional<DriverServiceRequest> findByIdWithGraph(@Param("id") Long id);

    // Optional: if you add per-driver listing
    @EntityGraph(attributePaths = {"vehicle", "servicesNeeded"})
    Page<DriverServiceRequest> findByEpfOrderByCreatedAtDesc(String epf, Pageable pageable);
}
