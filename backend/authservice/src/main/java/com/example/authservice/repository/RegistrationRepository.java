package com.example.authservice.repository;

import com.example.authservice.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    Optional<Registration> findByIdAndDeletedFalse(Long id);

    // ✅ add/keep this so UserService can look up by EPF
    Optional<Registration> findByEpfNo(String epfNo);

    boolean existsByEpfNo(String epfNo);

    List<Registration> findByDeletedFalse();
}
