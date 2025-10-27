package com.example.authservice.controller;

import com.example.authservice.dto.AssignRoleRequest;
import com.example.authservice.dto.CreateUserFromEmployeeRequest;
import com.example.authservice.model.AuditLog;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.UserService;
import lombok.Data;
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

  // small DTO for PUT /users/{id}
  @Data
  public static class UpdateUserRequest {
    private String email;
  }

  // ===== LIST USERS =====
  // who can view the user list in UI
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD','ROLE_HOD','ROLE_GM','ROLE_CHAIRMAN')")
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

      var roleCodes = users.findAuthorities(u.getId());                // e.g. ["ADMIN","HRD"]
      var perms     = service.effectivePermissionCodes(u.getId());     // e.g. ["READ","UPDATE"]

      out.add(Map.of(
          "id", u.getId(),
          "username", Optional.ofNullable(u.getUsername()).orElse(""),
          "email", Optional.ofNullable(u.getEmail()).orElse(""),
          "fullName", Optional.ofNullable(u.getFullName()).orElse(""),
          "department", Optional.ofNullable(u.getDepartment()).orElse(""),
          "imageUrl", Optional.ofNullable(imageUrl).orElse(""),
          "epfNo", Optional.ofNullable(u.getEpfNo()).orElse(""),
          "roles", roleCodes == null ? List.of() : roleCodes,
          "permissions", perms == null ? List.of() : perms
      ));
    }
    return out;
  }

  // ===== USERS BY ROLE (for dropdowns etc.)
  // ADMIN or HRD can view this
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
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

  // ===== CREATE USER FROM EMPLOYEE (query param style)
  // ONLY ADMIN or HRD can create new accounts
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/create-from-employee")
  public User create(
      @RequestParam("epfNo") String epfNo,
      @RequestBody CreateUserFromEmployeeRequest req
  ) {
    return service.createFromEmployee(epfNo, req);
  }

  // (legacy path version, still allowed)
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/create-from-employee/{epfNo}")
  public User createLegacy(
      @PathVariable String epfNo,
      @RequestBody CreateUserFromEmployeeRequest req
  ) {
    return service.createFromEmployee(epfNo, req);
  }

  // ===== UPDATE BASIC USER FIELDS (email, etc.)
  // ADMIN or HRD allowed to edit basic info
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PutMapping("/{id}")
  public void updateUser(
      @PathVariable Long id,
      @RequestBody UpdateUserRequest body
  ) {
    service.updateUserBasic(id, body.getEmail());
  }

  // ===== ASSIGN ROLE TO USER =====
  // ONLY ADMIN can assign roles
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/assign-role")
  public void assignRole(
      @PathVariable Long id,
      @RequestBody AssignRoleRequest req
  ) {
    service.assignRole(id, req.getRoleCode());
  }

  // ===== TRANSFER ROLE (ADMIN ONLY) =====
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{fromUserId}/transfer-role/{toUserId}/{roleCode}")
  public void transferRole(
      @PathVariable Long fromUserId,
      @PathVariable Long toUserId,
      @PathVariable String roleCode
  ) {
    service.transferRole(fromUserId, toUserId, roleCode);
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{fromUserId}/transfer-role-to-employee/{epfNo}/{roleCode}")
  public void transferRoleToEmployee(
      @PathVariable Long fromUserId,
      @PathVariable String epfNo,
      @PathVariable String roleCode
  ) {
    var to = service.list().stream()
        .filter(u -> epfNo.equals(u.getEpfNo()))
        .findFirst()
        .orElseThrow();
    service.transferRole(fromUserId, to.getId(), roleCode);
  }

  // ===== PER-USER PERMISSION OVERRIDES (ADMIN ONLY) =====
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/permissions/grant/{permCode}")
  public void grantUserPermAlias(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.grantUserPermission(id, permCode);
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/permissions/revoke/{permCode}")
  public void revokeUserPermAlias(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.revokeUserPermission(id, permCode);
  }

  // short aliases
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/grant/{permCode}")
  public void grantUserPerm(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.grantUserPermission(id, permCode);
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/revoke/{permCode}")
  public void revokeUserPerm(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.revokeUserPermission(id, permCode);
  }

  // ===== PERMISSION VIEWS =====
  // direct overrides: ADMIN only
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @GetMapping("/{id}/permissions/direct")
  public List<String> directGrants(@PathVariable Long id) {
    return service.directGrantCodes(id);
  }

  // effective permissions: ADMIN or HRD can inspect
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{id}/permissions/effective")
  public List<String> effectivePerms(@PathVariable Long id) {
    return service.effectivePermissionCodes(id);
  }

  // ===== DELETE USER =====
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    service.delete(id);
  }

  // ===== HISTORY =====
  // anyone logged-in can get THEIR OWN history
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/history/me")
  public List<AuditLog> myHistory() {
    return service.myHistory();
  }

  // ADMIN can read full audit
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @GetMapping("/history")
  public List<AuditLog> allHistory() {
    return service.allHistory();
  }

  // ===== EXPORT USERS (ADMIN / HRD) =====
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/export")
  public List<User> export() {
    return service.list();
  }

  // ===== LEGACY HELPERS (ADMIN / HRD) =====
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{username}/permissions")
  public List<String> getUserPermissions(@PathVariable String username) {
    var u = users.findByUsername(username).orElseThrow();
    return service.effectivePermissionCodes(u.getId());
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{username}/roles")
  public List<String> getUserRoles(@PathVariable String username) {
    var u = users.findByUsername(username).orElseThrow();
    return users.findAuthorities(u.getId());
  }
}
