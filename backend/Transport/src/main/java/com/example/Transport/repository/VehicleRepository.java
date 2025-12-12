package com.example.Transport.repository;

import com.example.Transport.entity.Vehicle;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Page<Vehicle> findByIsDeleted(int isDeleted, Pageable pageable);

    boolean existsByVehicleNumberAndIsDeleted(String vehicleNumber, int isDeleted);

    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.isDeleted = :isDeleted AND (
              LOWER(v.vehicleNumber)  LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(v.brand)          LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(v.model)          LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(v.chassisNumber)  LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(v.engineNumber)   LIKE LOWER(CONCAT('%', :q, '%'))
        )
        """)
    Page<Vehicle> searchByIsDeleted(@Param("isDeleted") int isDeleted,
                                    @Param("q") String q,
                                    Pageable pageable);

    /** Find vehicles whose odometer is within `windowKm` of a multiple of `intervalKm` */
    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.isDeleted = 0
          AND v.totalKmDriven IS NOT NULL
          AND (
                MOD(v.totalKmDriven, :intervalKm) <= :windowKm
             OR MOD(v.totalKmDriven, :intervalKm) >= (:intervalKm - :windowKm)
          )
        """)
    List<Vehicle> findDueByOdometer(@Param("intervalKm") long intervalKm,
                                    @Param("windowKm") long windowKm);

    Optional<Vehicle> findByVehicleNumberAndIsDeleted(String vehicleNumber, Integer isDeleted);

    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.isDeleted = :isDeleted
          AND LOWER(v.vehicleNumber) = LOWER(:vehicleNumber)
        """)
    Optional<Vehicle> findByVehicleNumberCaseInsensitive(@Param("vehicleNumber") String vehicleNumber,
                                                         @Param("isDeleted") Integer isDeleted);
}
