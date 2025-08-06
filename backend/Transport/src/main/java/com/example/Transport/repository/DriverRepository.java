package com.example.Transport.repository;

import com.example.Transport.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, String> {

    // 🔁 Changed to return Long instead of boolean
    @Query(value = "SELECT COUNT(*) FROM employee WHERE employee_id = :employeeId", nativeQuery = true)
    Long countByEmployeeId(String employeeId);

    // ✅ Use Integer for soft delete logic
    Optional<Driver> findByEmployeeIdAndIsDeleted(String employeeId, Integer isDeleted);
}
