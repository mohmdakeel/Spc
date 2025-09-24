package com.example.Transport.repository;

import com.example.Transport.entity.Vehicle;
import com.example.Transport.entity.VehicleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleImageRepository extends JpaRepository<VehicleImage, Long> {
    List<VehicleImage> findByVehicleOrderBySortOrderAscIdAsc(Vehicle vehicle);
    long countByVehicle(Vehicle vehicle);
}
