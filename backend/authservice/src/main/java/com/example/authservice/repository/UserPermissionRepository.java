// src/main/java/com/example/authservice/repository/UserPermissionRepository.java
package com.example.authservice.repository;

import com.example.authservice.model.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

  Optional<UserPermission> findByUserAndPermission(User user, Permission permission);

  @Query("select up.permission.code from UserPermission up where up.user.id = :uid and up.effect = 'GRANT'")
  List<String> findGrantCodes(@Param("uid") Long uid);

  @Query("select up.permission.code from UserPermission up where up.user.id = :uid and up.effect = 'REVOKE'")
  List<String> findRevokeCodes(@Param("uid") Long uid);
}
