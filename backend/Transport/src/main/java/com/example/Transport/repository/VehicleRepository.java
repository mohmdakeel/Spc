package com.example.Transport.repository;

import com.example.Transport.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByIdAndIsDeleted(Long id, Integer isDeleted);

    List<Vehicle> findByIsDeleted(Integer isDeleted);

    // Optional helpers for boolean usage
    default Optional<Vehicle> findByIdAndIsDeleted(Long id, Boolean isDeleted) {
        return findByIdAndIsDeleted(id, isDeleted ? 1 : 0);
    }

    default List<Vehicle> findByIsDeleted(Boolean isDeleted) {
        return findByIsDeleted(isDeleted ? 1 : 0);
    }
}
