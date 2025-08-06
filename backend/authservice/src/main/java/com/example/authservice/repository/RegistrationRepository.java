package com.example.authservice.repository;

import com.example.authservice.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.hibernate.annotations.Where;

import java.util.List;
import java.util.Optional;

@Repository
@Where(clause = "deleted = false") // Automatically filter out soft-deleted
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByDeletedFalse();

    Optional<Registration> findByIdAndDeletedFalse(Long id);
}