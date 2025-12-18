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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

  private final UserRepository users;
  private final RegistrationRepository regs;
  private final RoleRepository roles;
  private final UserRoleRepository userRoles;
  private final UserPermissionRepository userPerms;
  private final PermissionRepository perms;
  private final PasswordEncoder encoder;
  private final AuditService audit;

  // -----------------------------------------------------------------
  // PROTECTED ACCOUNTS
  // -----------------------------------------------------------------
  private boolean isProtected(User u) {
    return u != null && ProtectedAccounts.PROTECTED_USERNAMES.stream()
        .anyMatch(p -> p.equalsIgnoreCase(u.getUsername()));
  }

  private void forbid(String msg) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
  }

  private String actor() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a == null ? "system" : a.getName();
  }

  // -----------------------------------------------------------------
  // LIST
  // -----------------------------------------------------------------
  public List<User> list() {
    return users.findAll();
  }

  // -----------------------------------------------------------------
  // CREATE FROM EMPLOYEE
  // -----------------------------------------------------------------
  @Transactional
  public User createFromEmployee(String epfNo, CreateUserFromEmployeeRequest req) {
    var reg = regs.findByEpfNoAndDeletedFalse(epfNo)
        .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + epfNo));

    String username = req.getUsername().trim().toLowerCase();
    if (users.findByUsername(username).isPresent()) {
      throw new IllegalArgumentException("Username already taken: " + username);
    }

    String password = req.getPassword();
    if (password == null || password.isBlank()) {
      password = generateStrongPassword();
    }

    User user = User.builder()
        .username(username)
        .password(encoder.encode(password))
        .email(req.getEmail() == null ? null : req.getEmail().trim().toLowerCase())
        .epfNo(epfNo)
        .fullName(reg.getFullName())
        .department(reg.getDepartment())
        .active(true)
        .locked(false)
        .addedDateTime(LocalDateTime.now())
        .build();

    user = users.save(user);

    if (req.getRole() != null && !req.getRole().isBlank()) {
      assignRole(user.getId(), req.getRole());
    }

    audit.log(actor(), "CREATE_USER", "User", user.getId().toString(),
        "{\"epfNo\":\"" + epfNo + "\",\"username\":\"" + username + "\"}");

    return user;
  }

  // -----------------------------------------------------------------
  // UPDATE BASIC (email)
  // -----------------------------------------------------------------
  @Transactional
  public void updateUserBasic(Long id, String email) {
    User u = users.findById(id).orElseThrow();
    if (isProtected(u)) forbid("Protected account cannot be modified.");

    if (email != null && !email.isBlank()) {
      u.setEmail(email.trim().toLowerCase());
    }
    users.save(u);

    audit.log(actor(), "UPDATE_USER", "User", id.toString(),
        "{\"email\":\"" + u.getEmail() + "\"}");
  }

  // -----------------------------------------------------------------
  // ASSIGN ROLE
  // -----------------------------------------------------------------
  @Transactional
  public void assignRole(Long userId, String roleCode) {
    User u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("Protected account role cannot be changed.");

    Role r = roles.findByCode(roleCode).orElseThrow();
    if (!userRoles.existsByUserIdAndRoleId(userId, r.getId())) {
      userRoles.save(UserRole.builder().user(u).role(r).build());
    }

    audit.log(actor(), "ASSIGN_ROLE", "UserRole", userId.toString(),
        "{\"roleCode\":\"" + roleCode + "\"}");
  }

  // -----------------------------------------------------------------
  // TRANSFER ROLE
  // -----------------------------------------------------------------
  @Transactional
  public void transferRole(Long fromUserId, Long toUserId, String roleCode) {
    User from = users.findById(fromUserId).orElseThrow();
    User to = users.findById(toUserId).orElseThrow();
    if (isProtected(from) || isProtected(to)) forbid("Protected account in role transfer.");

    Role r = roles.findByCode(roleCode).orElseThrow();

    userRoles.findByUserAndRole(from, r).ifPresent(userRoles::delete);
    if (!userRoles.existsByUserIdAndRoleId(toUserId, r.getId())) {
      userRoles.save(UserRole.builder().user(to).role(r).build());
    }

    audit.log(actor(), "TRANSFER_ROLE", "UserRole", toUserId.toString(),
        "{\"fromUserId\":" + fromUserId + ",\"roleCode\":\"" + roleCode + "\"}");
  }

  // -----------------------------------------------------------------
  // ADMIN RESET PASSWORD
  // -----------------------------------------------------------------
  @Transactional
  public String adminResetPassword(Long userId) {
    User u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("Protected account password cannot be reset.");

    String newPass = passwordFromEmployeeNumber(u);
    u.setPassword(encoder.encode(newPass));
    users.save(u);

    audit.log(actor(), "ADMIN_RESET_PASSWORD", "User", userId.toString(), "{}");
    return newPass;
  }

  // -----------------------------------------------------------------
  // LOCK / UNLOCK / ACTIVATE / DEACTIVATE
  // -----------------------------------------------------------------
  @Transactional
  public void lockUser(Long id) { updateStatus(id, u -> u.setLocked(true), "LOCK_USER"); }

  @Transactional
  public void unlockUser(Long id) { updateStatus(id, u -> u.setLocked(false), "UNLOCK_USER"); }

  @Transactional
  public void deactivateUser(Long id) { updateStatus(id, u -> u.setActive(false), "DEACTIVATE_USER"); }

  @Transactional
  public void activateUser(Long id) { updateStatus(id, u -> u.setActive(true), "ACTIVATE_USER"); }

  private void updateStatus(Long id, java.util.function.Consumer<User> updater, String action) {
    User u = users.findById(id).orElseThrow();
    if (isProtected(u)) forbid("Protected account cannot be modified.");
    updater.accept(u);
    users.save(u);
    audit.log(actor(), action, "User", id.toString(), "{}");
  }

  // -----------------------------------------------------------------
  // PERMISSIONS: GRANT / REVOKE
  // -----------------------------------------------------------------
  @Transactional
  public void grantUserPermission(Long userId, String permCode) {
    updateUserPerm(userId, permCode, UserPermEffect.GRANT);
  }

  @Transactional
  public void revokeUserPermission(Long userId, String permCode) {
    updateUserPerm(userId, permCode, UserPermEffect.REVOKE);
  }

  private void updateUserPerm(Long userId, String permCode, UserPermEffect effect) {
    User u = users.findById(userId).orElseThrow();
    if (isProtected(u)) forbid("Protected account permissions cannot be changed.");

    Permission p = perms.findByCode(permCode).orElseThrow();

    UserPermission up = userPerms.findByUserAndPermission(u, p)
        .orElseGet(() -> UserPermission.builder().user(u).permission(p).build());

    up.setEffect(effect);
    userPerms.save(up);

    audit.log(actor(),
        effect == UserPermEffect.GRANT ? "GRANT_PERMISSION" : "REVOKE_PERMISSION",
        "UserPermission", userId.toString(),
        "{\"permCode\":\"" + permCode + "\"}");
  }

  // -----------------------------------------------------------------
  // PERMISSION VIEWS
  // -----------------------------------------------------------------
  public List<String> directGrantCodes(Long userId) {
    return userPerms.findGrantCodes(userId);
  }

  public List<String> effectivePermissionCodes(Long userId) {
    Set<String> base = new LinkedHashSet<>(users.findRolePermissionCodes(userId));
    base.addAll(userPerms.findGrantCodes(userId));
    base.removeAll(userPerms.findRevokeCodes(userId));
    return new ArrayList<>(base);
  }

  // -----------------------------------------------------------------
  // DELETE USER
  // -----------------------------------------------------------------
  @Transactional
  public void delete(Long id) {
    User u = users.findById(id).orElseThrow();
    if (isProtected(u)) forbid("Protected account cannot be deleted.");

    if (u.getEpfNo() != null) {
      regs.findByEpfNoAndDeletedFalse(u.getEpfNo())
          .ifPresent(r -> r.markAsDeleted(actor()));
    }

    users.delete(u);
    audit.log(actor(), "DELETE_USER", "User", id.toString(), "{}");
  }

  // -----------------------------------------------------------------
  // AUDIT HISTORY
  // -----------------------------------------------------------------
  public List<AuditLog> myHistory() {
    return audit.search(actor(), null, null, null);
  }

  public List<AuditLog> allHistory() {
    return audit.search(null, null, null, null);
  }

  // -----------------------------------------------------------------
  // PASSWORD GENERATOR
  // -----------------------------------------------------------------
  private String generateStrongPassword() {
    String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    String lower = "abcdefghijkmnpqrstuvwxyz";
    String digits = "23456789";
    String symbols = "@#$%&*?";
    String all = upper + lower + digits + symbols;

    Random rnd = new Random();
    StringBuilder sb = new StringBuilder();

    sb.append(upper.charAt(rnd.nextInt(upper.length())));
    sb.append(lower.charAt(rnd.nextInt(lower.length())));
    sb.append(digits.charAt(rnd.nextInt(digits.length())));
    sb.append(symbols.charAt(rnd.nextInt(symbols.length())));

    for (int i = 4; i < 12; i++) {
      sb.append(all.charAt(rnd.nextInt(all.length())));
    }

    List<Character> chars = new ArrayList<>();
    for (char c : sb.toString().toCharArray()) chars.add(c);
    Collections.shuffle(chars, rnd);

    return chars.stream().collect(StringBuilder::new, StringBuilder::append, StringBuilder::append).toString();
  }

  private String passwordFromEmployeeNumber(User user) {
    String epf = user.getEpfNo();
    if (epf == null || epf.isBlank()) {
      return generateStrongPassword();
    }
    String normalized = epf.replaceAll("\\s+", "");
    return "Spc@" + normalized;
  }
}
