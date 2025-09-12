package com.example.Transport.repository;

import com.example.Transport.entity.VehicleTrip;
import com.example.Transport.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Date;
import java.util.List;

public interface VehicleTripRepository extends JpaRepository<VehicleTrip, Long> {

    List<VehicleTrip> findByStatus(TripStatus status);

    // Overlap check: (pickupAt < to) && (expectedReturnAt > from)
    List<VehicleTrip> findByStatusInAndPickupAtLessThanAndExpectedReturnAtGreaterThan(
            Collection<TripStatus> statuses, Date to, Date from);
}
