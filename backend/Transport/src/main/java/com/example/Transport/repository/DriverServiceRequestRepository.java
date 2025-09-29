package com.example.Transport.repository;

import com.example.Transport.entity.DriverServiceRequest;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverServiceRequestRepository extends JpaRepository<DriverServiceRequest, Long> {
    Page<DriverServiceRequest> findAll(Pageable pageable);
}
