package com.example.authservice.repository;

import com.example.authservice.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
  Optional<Registration> findByEpfNoAndDeletedFalse(String epfNo);
  Optional<Registration> findByEpfNo(String epfNo);
  List<Registration> findAllByDeletedFalseOrderByEpfNoAsc();
}