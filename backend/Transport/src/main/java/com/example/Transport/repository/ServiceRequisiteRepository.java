package com.example.Transport.repository;

import com.example.Transport.entity.ServiceRequisite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Profile("db")
@Repository
public interface ServiceRequisiteRepository extends JpaRepository<ServiceRequisite, Long> {
    Optional<ServiceRequisite> findByDriverServiceRequestId(Long dsrId);
}
