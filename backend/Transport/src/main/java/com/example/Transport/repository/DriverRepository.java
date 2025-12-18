package com.example.Transport.repository;

import com.example.Transport.entity.Driver;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DriverRepository extends JpaRepository<Driver, String> {
    Page<Driver> findByIsDeleted(int isDeleted, Pageable pageable);
    Page<Driver> findByIsDeletedAndNameContainingIgnoreCase(int isDeleted, String name, Pageable pageable);
    boolean existsByEmployeeIdAndIsDeleted(String employeeId, int isDeleted);

    @Query("""
        SELECT d FROM Driver d
        WHERE d.isDeleted = :isDeleted AND (
              LOWER(d.name)           LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(d.phone)          LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(d.email)          LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(d.licenseNumber)  LIKE LOWER(CONCAT('%', :q, '%'))
        )
        """)
    Page<Driver> searchByIsDeleted(@Param("isDeleted") int isDeleted,
                                  @Param("q") String q,
                                  Pageable pageable);
}