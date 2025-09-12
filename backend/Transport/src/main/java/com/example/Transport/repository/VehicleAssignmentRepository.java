package com.example.Transport.repository;

import com.example.Transport.entity.VehicleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleAssignmentRepository extends JpaRepository<VehicleAssignment, Long> {
    List<VehicleAssignment> findByRequestId(Long requestId);
}
