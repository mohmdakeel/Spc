// src/main/java/com/example/authservice/repository/RolePermissionRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

  Optional<RolePermission> findByRoleAndPermission(Role role, Permission permission);

  @Query("""
    select p.code
    from RolePermission rp join rp.permission p
    where rp.role.code = :roleCode
  """)
  List<String> findPermissionCodesByRoleCode(@Param("roleCode") String roleCode);
}
