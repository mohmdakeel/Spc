package com.example.authservice.repository;

import com.example.authservice.model.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByUsername(String username);

  // ✅ add this so code can compile if later you want to search by email
  Optional<User> findByEmail(String email);

  Optional<User> findByEmailIgnoreCase(String email);

  // list role codes for a given user
  @Query("""
    SELECT r.code
    FROM Role r
    WHERE r.id IN (
      SELECT ur.role.id
      FROM UserRole ur
      WHERE ur.user.id = :uid
    )
  """)
  List<String> findAuthorities(@Param("uid") Long uid);

  // collect permission codes through roles
  @Query("""
    SELECT DISTINCT p.code
    FROM Permission p
    JOIN RolePermission rp ON rp.permission.id = p.id
    JOIN UserRole ur ON ur.role.id = rp.role.id
    WHERE ur.user.id = :uid
  """)
  List<String> findRolePermissionCodes(@Param("uid") Long uid);

  // convenience: same result as above for older code paths
  @Query("""
    SELECT DISTINCT p.code
    FROM Permission p
    JOIN RolePermission rp ON rp.permission.id = p.id
    JOIN UserRole ur ON ur.role.id = rp.role.id
    WHERE ur.user.id = :uid
  """)
  List<String> findPermissionCodes(@Param("uid") Long uid);

  // users by role (for dropdowns etc.)
  @Query("""
    SELECT u
    FROM User u
    WHERE u.id IN (
      SELECT ur.user.id
      FROM UserRole ur JOIN ur.role r
      WHERE r.code = :roleCode
    )
    ORDER BY u.username
  """)
  List<User> findUsersByRoleCode(@Param("roleCode") String roleCode);
}
