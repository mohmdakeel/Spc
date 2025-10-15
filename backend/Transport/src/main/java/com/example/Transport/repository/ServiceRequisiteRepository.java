package com.example.Transport.repository;

import com.example.Transport.entity.ServiceRequisite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceRequisiteRepository extends JpaRepository<ServiceRequisite, Long> {
    Optional<ServiceRequisite> findByDriverServiceRequestId(Long dsrId);
}
