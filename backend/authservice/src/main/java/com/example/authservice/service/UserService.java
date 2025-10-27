package com.example.authservice.service;

import com.example.authservice.dto.CreateUserFromEmployeeRequest;
import com.example.authservice.model.*;
import com.example.authservice.repository.*;
import com.example.authservice.security.ProtectedAccounts;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

  private final UserRepository users;
  private final RegistrationRepository regs;
  private final RoleRepository roles;
  private final UserRoleRepository userRoles;
  private final PasswordEncoder encoder;
  private final AuditService audit;
  private final AuditLogRepository auditRepo;

  // per-user overrides
  private final UserPermissionRepository userPerms;
  private final PermissionRepository perms;

  // ---------- helpers ----------
  private boolean isProtected(User u) {
    if (u == null || u.getUsername() == null) return false;
    return ProtectedAccounts.PROTECTED_USERNAMES.stream()
        .anyMatch(root -> root.equalsIgnoreCase(u.getUsername()));
  }

  private void forbid(String msg) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
  }

  private String actor() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return (a == null) ? "system" : a.getName();
  }

  // ---------- basic list ----------
  public List<User> list() {
    return users.findAll();
  }

  // ---------- create user from employee ----------
  public User createFromEmployee(String epfNo, CreateUserFromEmployeeRequest req) {
    var reg = regs.findByEpfNoAndDeletedFalse(epfNo)
        .orElseThrow(() -> new IllegalArgumentException("Employee not found for EPF"));

    var u = User.builder()
        .epfNo(reg.getEpfNo())
        .username(req.getUsername().trim().toLowerCase())
        .email(req.getEmail() == null ? null : req.getEmail().trim().toLowerCase())
        .fullName(reg.getFullName())
        .department(reg.getDepartment())
        .active(true)
        .addedDateTime(LocalDateTime.now())
        .build();

    u.setPassword(encoder.encode(req.getPassword()));
    var saved = users.save(u);

    // attach initial role if provided
    if (req.getRole() != null && !req.getRole().isBlank()) {
      var r = roles.findByCode(req.getRole()).orElseThrow();
      userRoles.findByUserAndRole(saved, r)
          .orElseGet(() -> userRoles.save(
              UserRole.builder()
                  .user(saved)
                  .role(r)
                  .build()
          ));
    }

    audit.log(
        actor(),
        "CREATE",
        "User",
        String.valueOf(saved.getId()),
        "{\"epf\":\"" + saved.getEpfNo() + "\", \"role\":\"" + req.getRole() + "\"}"
    );

    return saved;
  }

  // ---------- update basic info (email etc.) ----------
  public void updateUserBasic(Long id, String newEmail) {
    var u = users.findById(id).orElseThrow();

    if (isProtected(u)) {
      forbid("Protected account cannot be modified.");
    }

    if (newEmail != null && !newEmail.isBlank()) {
      u.setEmail(newEmail.trim().toLowerCase());
    }

    users.save(u);

    audit.log(
        actor(),
        "UPDATE",
        "User",
        String.valueOf(id),
        "{\"email\":\"" + u.getEmail() + "\"}"
    );
  }

  // ---------- assign role ----------
  public void assignRole(Long userId, String roleCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) {
      forbid("Protected account cannot have roles changed.");
    }

    var r = roles.findByCode(roleCode).orElseThrow();

    if (!userRoles.existsByUserIdAndRoleId(u.getId(), r.getId())) {
      userRoles.save(
          UserRole.builder()
              .user(u)
              .role(r)
              .build()
      );
    }

    audit.log(
        actor(),
        "ASSIGN_ROLE",
        "User",
        String.valueOf(u.getId()),
        "{\"role\":\"" + roleCode + "\"}"
    );
  }

  // ---------- transfer role ----------
  public void transferRole(Long fromUserId, Long toUserId, String roleCode) {
    var fromUser = users.findById(fromUserId).orElseThrow();
    var toUser   = users.findById(toUserId).orElseThrow();

    if (isProtected(fromUser) || isProtected(toUser)) {
      forbid("Protected account in transfer; not allowed.");
    }

    var r = roles.findByCode(roleCode).orElseThrow();

    // remove role from source
    userRoles.findByUserAndRole(fromUser, r)
        .ifPresent(userRoles::delete);

    // give role to target if missing
    userRoles.findByUserAndRole(toUser, r)
        .orElseGet(() -> userRoles.save(
            UserRole.builder()
                .user(toUser)
                .role(r)
                .build()
        ));

    audit.log(
        actor(),
        "TRANSFER_ROLE",
        "User",
        String.valueOf(toUserId),
        "{\"from\":\"" + fromUserId + "\", \"role\":\"" + roleCode + "\"}"
    );
  }

  // ---------- delete user ----------
  public void delete(Long id) {
    var u = users.findById(id).orElseThrow();
    if (isProtected(u)) {
      forbid("Protected account cannot be deleted.");
    }

    users.delete(u);

    audit.log(
        actor(),
        "DELETE",
        "User",
        String.valueOf(id),
        "{}"
    );
  }

  // ---------- history ----------
  public List<AuditLog> myHistory() {
    return auditRepo.findAllByActorOrderByAtTimeDesc(actor());
  }

  public List<AuditLog> allHistory() {
    return auditRepo.findAllByOrderByAtTimeDesc();
  }

  // ---------- permissions math ----------
  // effective perms = role perms + GRANT - REVOKE
  public List<String> effectivePermissionCodes(Long userId) {
    var base = new LinkedHashSet<>(users.findRolePermissionCodes(userId));

    var grants  = new HashSet<>(userPerms.findGrantCodes(userId));
    var revokes = new HashSet<>(userPerms.findRevokeCodes(userId));

    base.addAll(grants);
    base.removeAll(revokes);

    return new ArrayList<>(base);
  }

  public List<String> directGrantCodes(Long userId) {
    return userPerms.findGrantCodes(userId);
  }

  public void grantUserPermission(Long userId, String permCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) {
      forbid("Protected account cannot be modified.");
    }

    var p = perms.findByCode(permCode).orElseThrow();

    var up = userPerms.findByUserAndPermission(u, p)
        .orElseGet(() -> userPerms.save(
            UserPermission.builder()
                .user(u)
                .permission(p)
                .effect(UserPermEffect.GRANT)
                .build()
        ));

    up.setEffect(UserPermEffect.GRANT);
    userPerms.save(up);

    audit.log(
        actor(),
        "USER_PERM_GRANT",
        "User",
        String.valueOf(userId),
        "{\"perm\":\"" + permCode + "\"}"
    );
  }

  public void revokeUserPermission(Long userId, String permCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) {
      forbid("Protected account cannot be modified.");
    }

    var p = perms.findByCode(permCode).orElseThrow();

    var up = userPerms.findByUserAndPermission(u, p)
        .orElseGet(() -> userPerms.save(
            UserPermission.builder()
                .user(u)
                .permission(p)
                .effect(UserPermEffect.REVOKE)
                .build()
        ));

    up.setEffect(UserPermEffect.REVOKE);
    userPerms.save(up);

    audit.log(
        actor(),
        "USER_PERM_REVOKE",
        "User",
        String.valueOf(userId),
        "{\"perm\":\"" + permCode + "\"}"
    );
  }
}
