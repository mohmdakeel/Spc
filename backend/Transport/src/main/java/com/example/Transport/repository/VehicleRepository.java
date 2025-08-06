package com.example.Transport.repository;

import com.example.Transport.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    // ✅ Correct query for finding vehicle by ID and deleted status
    Optional<Vehicle> findByIdAndIsDeleted(Long id, Integer isDeleted);
}
