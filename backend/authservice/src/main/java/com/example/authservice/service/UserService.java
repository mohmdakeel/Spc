package com.example.authservice.service;

import com.example.authservice.dto.CreateUserFromEmployeeRequest;
import com.example.authservice.model.*;
import com.example.authservice.repository.*;
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

  // -------- protected root account helpers --------
  private static final String PROTECTED_USERNAME = "admin1";
  private boolean isProtected(User u) {
    return u != null && PROTECTED_USERNAME.equalsIgnoreCase(u.getUsername());
  }
  private void forbid(String msg) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
  }

  public List<User> list() { return users.findAll(); }

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
    if (req.getRole() != null && !req.getRole().isBlank()) {
      var r = roles.findByCode(req.getRole()).orElseThrow();
      userRoles.findByUserAndRole(saved, r)
          .orElseGet(() -> userRoles.save(UserRole.builder().user(saved).role(r).build()));
    }
    audit.log(actor(), "CREATE", "User", String.valueOf(saved.getId()),
      "{\"epf\":\"" + saved.getEpfNo() + "\", \"role\":\"" + req.getRole() + "\"}");
    return saved;
  }

  public void assignRole(Long userId, String roleCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("admin1 is protected: roles cannot be changed.");
    var r = roles.findByCode(roleCode).orElseThrow();
    if (!userRoles.existsByUserIdAndRoleId(u.getId(), r.getId()))
      userRoles.save(UserRole.builder().user(u).role(r).build());
    audit.log(actor(), "ASSIGN_ROLE", "User", String.valueOf(u.getId()),
      "{\"role\":\"" + roleCode + "\"}");
  }

  public void transferRole(Long fromUserId, Long toUserId, String roleCode) {
    var fromUser = users.findById(fromUserId).orElseThrow();
    var toUser = users.findById(toUserId).orElseThrow();
    if (isProtected(fromUser) || isProtected(toUser)) {
      forbid("admin1 is protected: role transfers to/from this account are not allowed.");
    }
    var r = roles.findByCode(roleCode).orElseThrow();
    userRoles.findByUserAndRole(fromUser, r).ifPresent(userRoles::delete);
    userRoles.findByUserAndRole(toUser, r)
      .orElseGet(() -> userRoles.save(UserRole.builder().user(toUser).role(r).build()));
    audit.log(actor(), "TRANSFER_ROLE", "User", String.valueOf(toUserId),
      "{\"from\":\"" + fromUserId + "\", \"role\":\"" + roleCode + "\"}");
  }

  public void delete(Long id){
    var u = users.findById(id).orElseThrow();
    if (isProtected(u)) forbid("admin1 is protected: user cannot be deleted.");
    users.delete(u);
    audit.log(actor(), "DELETE", "User", String.valueOf(id), "{}");
  }

  public List<AuditLog> myHistory() { return auditRepo.findAllByActorOrderByAtTimeDesc(actor()); }
  public List<AuditLog> allHistory() { return auditRepo.findAllByOrderByAtTimeDesc(); }

  // ---- effective permissions (roles ± per-user overrides) ----
  public List<String> effectivePermissionCodes(Long userId) {
    var base = new LinkedHashSet<>(users.findRolePermissionCodes(userId));
    var grants = new HashSet<>(userPerms.findGrantCodes(userId));
    var revokes = new HashSet<>(userPerms.findRevokeCodes(userId));
    base.addAll(grants);
    base.removeAll(revokes);
    return new ArrayList<>(base);
  }

  // NEW: expose direct GRANT codes
  public List<String> directGrantCodes(Long userId) {
    return userPerms.findGrantCodes(userId);
  }

  public void grantUserPermission(Long userId, String permCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("admin1 is protected: permissions cannot be changed.");
    var p = perms.findByCode(permCode).orElseThrow();
    var up = userPerms.findByUserAndPermission(u, p)
        .orElseGet(() -> userPerms.save(
            UserPermission.builder().user(u).permission(p).effect(UserPermEffect.GRANT).build()
        ));
    up.setEffect(UserPermEffect.GRANT);
    userPerms.save(up);
    audit.log(actor(), "USER_PERM_GRANT", "User", String.valueOf(userId), "{\"perm\":\"" + permCode + "\"}");
  }

  public void revokeUserPermission(Long userId, String permCode) {
    var u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("admin1 is protected: permissions cannot be changed.");
    var p = perms.findByCode(permCode).orElseThrow();
    var up = userPerms.findByUserAndPermission(u, p)
        .orElseGet(() -> userPerms.save(
            UserPermission.builder().user(u).permission(p).effect(UserPermEffect.REVOKE).build()
        ));
    up.setEffect(UserPermEffect.REVOKE);
    userPerms.save(up);
    audit.log(actor(), "USER_PERM_REVOKE", "User", String.valueOf(userId), "{\"perm\":\"" + permCode + "\"}");
  }

  private String actor() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a == null ? "system" : a.getName();
  }
}
