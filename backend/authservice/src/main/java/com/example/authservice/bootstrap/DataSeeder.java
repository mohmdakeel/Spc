// src/main/java/com/example/authservice/bootstrap/DataSeeder.java
package com.example.authservice.bootstrap;

import com.example.authservice.model.*;
import com.example.authservice.repository.*;
import com.example.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

  private final RoleRepository roleRepo;
  private final PermissionRepository permRepo;
  private final RolePermissionRepository rolePermRepo;
  private final UserRepository userRepo;
  private final UserRoleRepository userRoleRepo;
  private final RegistrationRepository regRepo;
  private final AuditLogRepository auditRepo;
  private final PasswordEncoder encoder;
  private final UserService userService;

  // Global action permissions used across services
  private static final List<String> GLOBAL5 = List.of("CREATE", "READ", "UPDATE", "DELETE", "PRINT");

  @Override
  public void run(String... args) {
    // ===== roles (expanded) =====
    Role ADMIN            = role("ADMIN", "Administrator", "System admin");
    Role HR               = role("HR", "Human Resources", "HR role (legacy)");
    Role HRD              = role("HRD", "HR Department", "HR department wide");
    Role HOD              = role("HOD", "Head of Dept", "Department head");
    Role GM               = role("GM", "General Manager", "General manager");
    Role CHAIRMAN         = role("CHAIRMAN", "Chairman", "Chairman");
    Role TRANSPORT        = role("TRANSPORT", "Transport", "Transport staff");
    Role TRANSPORT_ADMIN  = role("TRANSPORT_ADMIN", "Transport Admin", "Transport admin");
    Role STAFF            = role("STAFF", "Staff", "General staff");
    Role VEHICLE_INCHARGE = role("VEHICLE_INCHARGE", "Vehicle In-Charge", "Vehicle management");
    Role GATE_SECURITY    = role("GATE_SECURITY", "Gate Security", "Gate/entry operations");

    // ===== base permissions (only create the 5 global action permissions) =====
    for (String p : GLOBAL5) perm(p, p.substring(0,1) + p.substring(1).toLowerCase());

    // Admin-only helpers
    Permission ROLE_TRANSFER      = perm("ROLE_TRANSFER", "Transfer roles between users");
    Permission ROLE_ADMIN         = perm("ROLE_ADMIN", "Admin roles & permissions");
    Permission PERM_USER_MANAGE   = perm("PERM_USER_MANAGE", "Manage per-user permissions");
    Permission PERM_ROLE_MANAGE   = perm("PERM_ROLE_MANAGE", "Manage role permissions");
    Permission USER_EXPORT        = perm("USER_EXPORT", "Export users CSV");
    Permission USER_TRANSFER_ROLE = perm("USER_TRANSFER_ROLE", "Transfer role between users");

    // ===== role → permission grants =====
    // ✅ ADMIN gets full control: CRUD + PRINT + admin helpers
    grant(ADMIN, perms(GLOBAL5));
    grant(ADMIN, List.of(ROLE_TRANSFER, ROLE_ADMIN, PERM_USER_MANAGE, PERM_ROLE_MANAGE, USER_EXPORT, USER_TRANSFER_ROLE));

    // ❗ Non-admins get NO CREATE/UPDATE/DELETE (read-only, with optional print)
    grant(HR,               perms(List.of("READ")));
    grant(HRD,              perms(List.of("READ")));
    grant(HOD,              perms(List.of("READ","PRINT")));
    grant(GM,               perms(List.of("READ","PRINT")));
    grant(CHAIRMAN,         perms(List.of("READ","PRINT")));
    grant(STAFF,            perms(List.of("READ")));
    grant(GATE_SECURITY,    perms(List.of("READ")));
    grant(TRANSPORT,        perms(List.of("READ","PRINT")));
    grant(TRANSPORT_ADMIN,  perms(List.of("READ","PRINT"))); // keep no CRUD; CRUD stays with ADMIN

    // ===== seed registrations =====
    upsertReg("EPF-0001", "Seed Admin One", "IT");
    upsertReg("EPF-0002", "Seed Admin Two", "IT");
    upsertReg("EPF-2001", "Haris HRD", "HR");
    upsertReg("EPF-3001", "Nimal Transport Admin", "Transport");
    upsertReg("EPF-3002", "Akeel Transport", "Transport");
    upsertReg("EPF-4001", "Gate Security One", "Security");

    Registration r1  = regRepo.findByEpfNoAndDeletedFalse("EPF-0001").orElseThrow();
    Registration r2  = regRepo.findByEpfNoAndDeletedFalse("EPF-0002").orElseThrow();
    Registration rH  = regRepo.findByEpfNoAndDeletedFalse("EPF-2001").orElseThrow();
    Registration rTA = regRepo.findByEpfNoAndDeletedFalse("EPF-3001").orElseThrow();
    Registration rT  = regRepo.findByEpfNoAndDeletedFalse("EPF-3002").orElseThrow();
    Registration rGS = regRepo.findByEpfNoAndDeletedFalse("EPF-4001").orElseThrow();

    // ===== users =====
    if (userRepo.findByUsername("admin1").isEmpty()) {
      User u1 = userRepo.save(User.builder()
          .epfNo(r1.getEpfNo()).username("admin1").email("admin1@spc.lk")
          .fullName("Seed Admin One").active(true)
          .password(encoder.encode("Admin1@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(u1, ADMIN);
    }
    if (userRepo.findByUsername("admin2").isEmpty()) {
      User u2 = userRepo.save(User.builder()
          .epfNo(r2.getEpfNo()).username("admin2").email("admin2@spc.lk")
          .fullName("Seed Admin Two").active(true)
          .password(encoder.encode("Admin2@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(u2, ADMIN);
    }
    if (userRepo.findByUsername("haris").isEmpty()) {
      User hr = userRepo.save(User.builder()
          .epfNo(rH.getEpfNo()).username("haris").email("haris@spc.lk")
          .fullName("Haris HRD").active(true)
          .password(encoder.encode("Haris@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(hr, HRD);
    }
    if (userRepo.findByUsername("tadmin").isEmpty()) {
      User ta = userRepo.save(User.builder()
          .epfNo(rTA.getEpfNo()).username("tadmin").email("tadmin@spc.lk")
          .fullName("Nimal Transport Admin").active(true)
          .password(encoder.encode("Tadmin@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(ta, TRANSPORT_ADMIN);
    }
    if (userRepo.findByUsername("akeel").isEmpty()) {
      User t = userRepo.save(User.builder()
          .epfNo(rT.getEpfNo()).username("akeel").email("akeel@spc.lk")
          .fullName("Akeel Transport").active(true)
          .password(encoder.encode("Akeel@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(t, TRANSPORT);
    }
    if (userRepo.findByUsername("gate1").isEmpty()) {
      User gs = userRepo.save(User.builder()
          .epfNo(rGS.getEpfNo()).username("gate1").email("gate1@spc.lk")
          .fullName("Gate Security One").active(true)
          .password(encoder.encode("Gate1@123"))
          .addedDateTime(LocalDateTime.now()).build());
      link(gs, GATE_SECURITY);
    }

    // one-time audit marker
    if (auditRepo.count() == 0) {
      auditRepo.save(AuditLog.builder()
          .actor("system").action("SEED")
          .entityType("BOOTSTRAP").entityId("-")
          .details("Seed data").atTime(LocalDateTime.now()).build());
    }
  }

  // ---------- helpers ----------
  private Role role(String code, String name, String desc) {
    return roleRepo.findByCode(code).orElseGet(() ->
        roleRepo.save(Role.builder().code(code).name(name).description(desc).build())
    );
  }
  private Permission perm(String code, String desc) {
    return permRepo.findByCode(code).orElseGet(() ->
        permRepo.save(Permission.builder().code(code).description(desc).build())
    );
  }
  private List<Permission> perms(List<String> codes) {
    List<Permission> out = new ArrayList<>(codes.size());
    for (String c : codes) out.add(perm(c, c));
    return out;
  }
  private void upsertReg(String epf, String fullName, String dept) {
    regRepo.findByEpfNoAndDeletedFalse(epf).orElseGet(() ->
        regRepo.save(Registration.builder()
            .epfNo(epf).fullName(fullName).department(dept)
            .addedBy("system").addedTime(LocalDateTime.now())
            .deleted(false).build())
    );
  }
  private void grant(Role role, List<Permission> permissions) {
    for (Permission p : permissions) {
      rolePermRepo.findByRoleAndPermission(role, p)
          .orElseGet(() -> rolePermRepo.save(RolePermission.builder().role(role).permission(p).build()));
    }
  }
  private void link(User user, Role role) {
    userRoleRepo.findByUserAndRole(user, role)
        .orElseGet(() -> userRoleRepo.save(UserRole.builder().user(user).role(role).build()));
  }
}
