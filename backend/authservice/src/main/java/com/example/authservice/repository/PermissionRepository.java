// src/main/java/com/example/authservice/repository/PermissionRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.Permission;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
  Optional<Permission> findByCode(String code);

  @Query("""
      select p.code
      from Permission p
      join RolePermission rp on rp.permission.id = p.id
      join Role r on rp.role.id = r.id
      where r.code = :roleCode
      order by p.code
    """)
  List<String> findCodesByRoleCode(@Param("roleCode") String roleCode);
}
