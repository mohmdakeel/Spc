package com.example.Transport.repository;

import com.example.Transport.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, String> {

    // Cross-table validation (if needed)
    @Query(value = "SELECT COUNT(*) FROM employee WHERE employee_id = :employeeId", nativeQuery = true)
    Long countByEmployeeId(String employeeId);

    // Find by employeeId and isDeleted (Integer)
    Optional<Driver> findByEmployeeIdAndIsDeleted(String employeeId, Integer isDeleted);

    // List by isDeleted status (Integer)
    List<Driver> findByIsDeleted(Integer isDeleted);

    // --- Custom Methods Below (Optional) ---

    // By status (Active/Inactive/Suspended, etc.)
    List<Driver> findByStatusAndIsDeleted(String status, Integer isDeleted);

    // All drivers whose license expired
    @Query("SELECT d FROM Driver d WHERE d.licenseExpiryDate < CURRENT_DATE AND d.isDeleted = 0")
    List<Driver> findAllWithExpiredLicense();

    // --- Convenience overloads for Boolean (optional) ---
    default Optional<Driver> findByEmployeeIdAndIsDeleted(String employeeId, Boolean isDeleted) {
        return findByEmployeeIdAndIsDeleted(employeeId, isDeleted ? 1 : 0);
    }

    default List<Driver> findByIsDeleted(Boolean isDeleted) {
        return findByIsDeleted(isDeleted ? 1 : 0);
    }
}
