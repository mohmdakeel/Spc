// src/main/java/com/example/authservice/controller/UserController.java
package com.example.authservice.controller;

import com.example.authservice.dto.AssignRoleRequest;
import com.example.authservice.dto.CreateUserFromEmployeeRequest;
import com.example.authservice.model.AuditLog;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
  private final UserService service;
  private final UserRepository users;
  private final RegistrationRepository regs;

  @PreAuthorize("hasAnyRole('ADMIN','HR','HOD','GM','TRANSPORT')")
  @GetMapping
  public List<Map<String,Object>> list() {
    var all = service.list();
    var out = new ArrayList<Map<String,Object>>(all.size());
    for (User u : all) {
      String imageUrl = null;
      if (u.getEpfNo() != null) {
        var reg = regs.findByEpfNo(u.getEpfNo()).orElse(null);
        if (reg != null) imageUrl = reg.getImageUrl();
      }
      var roles = users.findAuthorities(u.getId());
      var perms = service.effectivePermissionCodes(u.getId());
      out.add(Map.of(
          "id", u.getId(),
          "username", Optional.ofNullable(u.getUsername()).orElse(""),
          "email", Optional.ofNullable(u.getEmail()).orElse(""),
          "fullName", Optional.ofNullable(u.getFullName()).orElse(""),
          "department", Optional.ofNullable(u.getDepartment()).orElse(""),
          "imageUrl", Optional.ofNullable(imageUrl).orElse(""),
          "epfNo", Optional.ofNullable(u.getEpfNo()).orElse(""),
          "roles", roles == null ? List.of() : roles,
          "permissions", perms == null ? List.of() : perms
      ));
    }
    return out;
  }

  // For role-filter dropdowns if needed
  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @GetMapping("/by-role/{roleCode}")
  public List<Map<String,Object>> byRole(@PathVariable String roleCode) {
    var list = users.findUsersByRoleCode(roleCode);
    var out = new ArrayList<Map<String,Object>>(list.size());
    for (User u : list) {
      out.add(Map.of(
        "id", u.getId(),
        "username", Optional.ofNullable(u.getUsername()).orElse(""),
        "fullName", Optional.ofNullable(u.getFullName()).orElse("")
      ));
    }
    return out;
  }

  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @PostMapping("/create-from-employee/{epfNo}")
  public User createLegacy(@PathVariable String epfNo, @RequestBody CreateUserFromEmployeeRequest req) {
    return service.createFromEmployee(epfNo, req);
  }

  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @PostMapping("/create-from-employee")
  public User create(@RequestParam("epfNo") String epfNo, @RequestBody CreateUserFromEmployeeRequest req) {
    return service.createFromEmployee(epfNo, req);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{id}/assign-role")
  public void assignRole(@PathVariable Long id, @RequestBody AssignRoleRequest req) {
    service.assignRole(id, req.getRoleCode());
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{fromUserId}/transfer-role/{toUserId}/{roleCode}")
  public void transferRole(@PathVariable Long fromUserId, @PathVariable Long toUserId, @PathVariable String roleCode) {
    service.transferRole(fromUserId, toUserId, roleCode);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{fromUserId}/transfer-role-to-employee/{epfNo}/{roleCode}")
  public void transferRoleToEmployee(@PathVariable Long fromUserId, @PathVariable String epfNo, @PathVariable String roleCode) {
    var to = service.list().stream().filter(u -> epfNo.equals(u.getEpfNo())).findFirst().orElseThrow();
    service.transferRole(fromUserId, to.getId(), roleCode);
  }

  // ---------- Per-user permission overrides ----------
  // FE-friendly aliases:
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{id}/permissions/grant/{permCode}")
  public void grantUserPermAlias(@PathVariable Long id, @PathVariable String permCode) {
    service.grantUserPermission(id, permCode);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{id}/permissions/revoke/{permCode}")
  public void revokeUserPermAlias(@PathVariable Long id, @PathVariable String permCode) {
    service.revokeUserPermission(id, permCode);
  }

  // Keep short routes too:
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{id}/grant/{permCode}")
  public void grantUserPerm(@PathVariable Long id, @PathVariable String permCode) {
    service.grantUserPermission(id, permCode);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/{id}/revoke/{permCode}")
  public void revokeUserPerm(@PathVariable Long id, @PathVariable String permCode) {
    service.revokeUserPermission(id, permCode);
  }

  // NEW: read direct (user-only) grants
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}/permissions/direct")
  public List<String> directGrants(@PathVariable Long id) {
    return service.directGrantCodes(id);
  }

  // Effective permissions
  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @GetMapping("/{id}/permissions/effective")
  public List<String> effectivePerms(@PathVariable Long id) {
    return service.effectivePermissionCodes(id);
  }
  // ---------------------------------------------------

  @PreAuthorize("hasRole('ADMIN')")
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) { service.delete(id); }

  @PreAuthorize("hasAnyRole('ADMIN','HR','HOD','GM','TRANSPORT')")
  @GetMapping("/history/me") public List<AuditLog> myHistory(){ return service.myHistory(); }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/history") public List<AuditLog> allHistory(){ return service.allHistory(); }

  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @GetMapping("/export") public List<User> export(){ return service.list(); }

  // Legacy helpers (now return effective perms)
  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @GetMapping("/{username}/permissions")
  public List<String> getUserPermissions(@PathVariable String username) {
    var u = users.findByUsername(username).orElseThrow();
    return service.effectivePermissionCodes(u.getId());
  }

  @PreAuthorize("hasAnyRole('ADMIN','HR')")
  @GetMapping("/{username}/roles")
  public List<String> getUserRoles(@PathVariable String username) {
    var u = users.findByUsername(username).orElseThrow();
    return users.findAuthorities(u.getId());
  }
}
