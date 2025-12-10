package com.example.authservice.controller;

import com.example.authservice.dto.*;
import com.example.authservice.model.AuditLog;
import com.example.authservice.model.User;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService service;
  private final UserRepository users;
  private final RegistrationRepository regs;

  // -----------------------------------------------------------------
  // DTOs
  // -----------------------------------------------------------------
  @Data
  public static class UpdateUserRequest {
    private String email;
  }

  // -----------------------------------------------------------------
  // LIST USERS
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD','ROLE_HOD','ROLE_GM','ROLE_CHAIRMAN')")
  @GetMapping
  public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
    var all = service.list();
    var out = new ArrayList<Map<String, Object>>(all.size());

    for (User u : all) {
      String imageUrl = null;
      if (u.getEpfNo() != null) {
        var reg = regs.findByEpfNo(u.getEpfNo()).orElse(null);
        if (reg != null) imageUrl = reg.getImageUrl();
      }

      var roleCodes = users.findAuthorities(u.getId());
      var perms = service.effectivePermissionCodes(u.getId());

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
    return ResponseEntity.ok(ApiResponse.ok(out));
  }

  // -----------------------------------------------------------------
  // CREATE USER FROM EMPLOYEE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/create-from-employee")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<User> createFromEmployee(
      @RequestParam String epfNo,
      @RequestBody CreateUserFromEmployeeRequest req
  ) {
    User user = service.createFromEmployee(epfNo, req);
    return ApiResponse.ok(user);
  }

  // -----------------------------------------------------------------
  // UPDATE USER (email)
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> updateUser(
      @PathVariable Long id,
      @RequestBody UpdateUserRequest body
  ) {
    service.updateUserBasic(id, body.getEmail());
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // ASSIGN ROLE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/assign-role")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> assignRole(
      @PathVariable Long id,
      @RequestBody AssignRoleRequest req
  ) {
    service.assignRole(id, req.getRoleCode());
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // TRANSFER ROLE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{fromUserId}/transfer-role/{toUserId}/{roleCode}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> transferRole(
      @PathVariable Long fromUserId,
      @PathVariable Long toUserId,
      @PathVariable String roleCode
  ) {
    service.transferRole(fromUserId, toUserId, roleCode);
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // ADMIN RESET PASSWORD
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/{id}/reset-password")
  public ApiResponse<Map<String, String>> adminResetPassword(@PathVariable Long id) {
    String newPassword = service.adminResetPassword(id);
    return ApiResponse.ok(Map.of("newPassword", newPassword));
  }

  // -----------------------------------------------------------------
  // LOCK / UNLOCK / ACTIVATE / DEACTIVATE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/{id}/lock")
  public ApiResponse<Void> lock(@PathVariable Long id) {
    service.lockUser(id);
    return ApiResponse.ok(null);
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/{id}/unlock")
  public ApiResponse<Void> unlock(@PathVariable Long id) {
    service.unlockUser(id);
    return ApiResponse.ok(null);
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/{id}/deactivate")
  public ApiResponse<Void> deactivate(@PathVariable Long id) {
    service.deactivateUser(id);
    return ApiResponse.ok(null);
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @PostMapping("/{id}/activate")
  public ApiResponse<Void> activate(@PathVariable Long id) {
    service.activateUser(id);
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // PERMISSIONS: GRANT / REVOKE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/permissions/grant/{permCode}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> grantUserPermission(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.grantUserPermission(id, permCode);
    return ApiResponse.ok(null);
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @PostMapping("/{id}/permissions/revoke/{permCode}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> revokeUserPermission(
      @PathVariable Long id,
      @PathVariable String permCode
  ) {
    service.revokeUserPermission(id, permCode);
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // PERMISSION VIEWS
  // -----------------------------------------------------------------
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @GetMapping("/{id}/permissions/direct")
  public ApiResponse<List<String>> directPermissions(@PathVariable Long id) {
    return ApiResponse.ok(service.directGrantCodes(id));
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{id}/permissions/effective")
  public ApiResponse<List<String>> effectivePermissions(@PathVariable Long id) {
    return ApiResponse.ok(service.effectivePermissionCodes(id));
  }

  // -----------------------------------------------------------------
  // DELETE USER
  // -----------------------------------------------------------------
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok(null);
  }

  // -----------------------------------------------------------------
  // AUDIT HISTORY
  // -----------------------------------------------------------------
  @PreAuthorize("isAuthenticated()")
  @GetMapping("/history/me")
  public ApiResponse<List<AuditLog>> myHistory() {
    return ApiResponse.ok(service.myHistory());
  }

  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  @GetMapping("/history")
  public ApiResponse<List<AuditLog>> allHistory() {
    return ApiResponse.ok(service.allHistory());
  }

  // -----------------------------------------------------------------
  // EXPORT USERS
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/export")
  public ApiResponse<List<User>> export() {
    return ApiResponse.ok(service.list());
  }

  // -----------------------------------------------------------------
  // LEGACY HELPERS (by username) — ONLY ONCE
  // -----------------------------------------------------------------
  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{username}/permissions")
  public ApiResponse<List<String>> getUserPermissions(@PathVariable String username) {
    var u = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return ApiResponse.ok(service.effectivePermissionCodes(u.getId()));
  }

  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HRD')")
  @GetMapping("/{username}/roles")
  public ApiResponse<List<String>> getUserRoles(@PathVariable String username) {
    var u = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return ApiResponse.ok(users.findAuthorities(u.getId()));
  }
}