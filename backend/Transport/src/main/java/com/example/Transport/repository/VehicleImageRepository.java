package com.example.Transport.repository;

import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.VehicleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import java.util.List;

@Profile("db")
@Repository
public interface VehicleImageRepository extends JpaRepository<VehicleImage, Long> {
    List<VehicleImage> findByVehicleOrderBySortOrderAscIdAsc(Vehicle vehicle);
    long countByVehicle(Vehicle vehicle);
}
