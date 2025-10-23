// src/main/java/com/example/authservice/repository/UserRoleRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.Role;
import com.example.authservice.model.User;
import com.example.authservice.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
  Optional<UserRole> findByUserAndRole(User user, Role role);
  boolean existsByUserIdAndRoleId(Long userId, Long roleId);
}
