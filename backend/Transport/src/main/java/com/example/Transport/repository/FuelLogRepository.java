package com.example.Transport.repository;

import com.example.Transport.entity.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {

    @Query("""
        SELECT f FROM FuelLog f
        WHERE (:month IS NULL OR f.month = :month)
          AND (:vehicleId IS NULL OR f.vehicle.id = :vehicleId)
          AND (:fromDate IS NULL OR COALESCE(f.logDate, f.createdAt) >= :fromDate)
          AND (:toDate IS NULL OR COALESCE(f.logDate, f.createdAt) <= :toDate)
        ORDER BY COALESCE(f.logDate, f.createdAt) ASC, f.id ASC
        """)
    List<FuelLog> search(@Param("month") String month,
                         @Param("vehicleId") Long vehicleId,
                         @Param("fromDate") Date fromDate,
                         @Param("toDate") Date toDate);
}
