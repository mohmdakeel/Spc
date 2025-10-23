// src/main/java/com/example/authservice/controller/RoleController.java
package com.example.authservice.controller;

import com.example.authservice.model.Permission;
import com.example.authservice.model.Role;
import com.example.authservice.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
  private final RoleService roles;

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping
  public List<Role> list() { return roles.listRoles(); }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/permissions")
  public List<Permission> perms() { return roles.listPerms(); }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{roleCode}/permissions")
  public List<String> rolePermissions(@PathVariable String roleCode) {
    return roles.listPermCodesForRole(roleCode);
  }

  // NEW: usernames who currently have this role
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{roleCode}/users")
  public List<String> roleUsers(@PathVariable String roleCode) {
    return roles.listUsernamesForRole(roleCode);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{roleCode}/grant/{permCode}")
  public void grant(@PathVariable String roleCode, @PathVariable String permCode) {
    roles.grant(roleCode, permCode);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{roleCode}/revoke/{permCode}")
  public void revoke(@PathVariable String roleCode, @PathVariable String permCode) {
    roles.revoke(roleCode, permCode);
  }
}
