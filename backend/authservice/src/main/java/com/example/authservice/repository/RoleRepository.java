// src/main/java/com/example/authservice/repository/RoleRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
  Optional<Role> findByCode(String code);
}