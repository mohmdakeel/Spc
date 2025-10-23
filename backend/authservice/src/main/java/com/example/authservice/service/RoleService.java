// src/main/java/com/example/authservice/service/RoleService.java
package com.example.authservice.service;

import com.example.authservice.model.*;
import com.example.authservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {
  private final RoleRepository roles;
  private final PermissionRepository perms;
  private final RolePermissionRepository rolePerms;
  private final UserRepository users; // NEW

  public List<Role> listRoles() { return roles.findAll(); }
  public List<Permission> listPerms() { return perms.findAll(); }

  // permissions assigned to a role (codes)
  public List<String> listPermCodesForRole(String roleCode) {
    return rolePerms.findPermissionCodesByRoleCode(roleCode);
  }

  // NEW: usernames who have a role
  public List<String> listUsernamesForRole(String roleCode) {
    return users.findUsersByRoleCode(roleCode)
                .stream().map(User::getUsername).toList();
  }

  // Role-level grant/revoke
  public void grant(String roleCode, String permCode) {
    var r = roles.findByCode(roleCode).orElseThrow();
    var p = perms.findByCode(permCode).orElseThrow();
    rolePerms.findByRoleAndPermission(r, p)
        .orElseGet(() -> rolePerms.save(RolePermission.builder().role(r).permission(p).build()));
  }

  public void revoke(String roleCode, String permCode) {
    var r = roles.findByCode(roleCode).orElseThrow();
    var p = perms.findByCode(permCode).orElseThrow();
    rolePerms.findByRoleAndPermission(r, p).ifPresent(rolePerms::delete);
  }
}
