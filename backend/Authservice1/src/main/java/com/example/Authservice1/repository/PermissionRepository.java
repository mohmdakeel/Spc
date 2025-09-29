package com.example.Authservice1.repository;
import com.example.Authservice1.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByCode(String code);
}
