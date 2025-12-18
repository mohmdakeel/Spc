package com.example.authservice.bootstrap;

import com.example.authservice.model.*;
import com.example.authservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

  // The ONLY permissions we want in the whole system
  private static final List<String> GLOBAL5 = List.of("CREATE", "READ", "UPDATE", "DELETE", "PRINT");

  @Override
  public void run(String... args) {
    seed();
  }

  @Transactional
  public synchronized void seed() {

    // ===== 1. ROLES (only the roles you use) =====
    Role ADMIN            = role("ADMIN", "Administrator", "System admin");
    Role AUTH_ADMIN       = role("AUTH_ADMIN", "Authentication Admin", "Admin limited to Auth service");
    Role TRANSPORT_ADMIN  = role("TRANSPORT_ADMIN", "Transport Admin", "Manages transport module");
    Role TRANSPORT        = role("TRANSPORT", "Transport Officer", "Transport-only staff");
    Role HRD              = role("HRD", "HR Department", "HR / HRD");
    Role HOD              = role("HOD", "Head of Dept", "Department head / manager");
    Role GM               = role("GM", "General Manager", "General manager");
    Role CHAIRMAN         = role("CHAIRMAN", "Chairman", "Chairman / board level");
    Role VEHICLE_INCHARGE = role("VEHICLE_INCHARGE", "Vehicle In-Charge", "Transport vehicle in-charge");
    Role GATE_SECURITY    = role("GATE_SECURITY", "Gate Security", "Gate / entry operations");
    Role STAFF            = role("STAFF", "Staff / Applicant", "Normal staff/applicant");

    // ===== 2. PERMISSIONS (only CREATE / READ / UPDATE / DELETE / PRINT) =====
    for (String p : GLOBAL5) {
      perm(p, p.substring(0,1) + p.substring(1).toLowerCase());
    }

    // ===== 3. ROLE → PERMISSIONS mapping =====
    //
    // ADMIN: full power in both Auth + Transport
    grant(ADMIN, perms(GLOBAL5)); // all 5
    grant(AUTH_ADMIN, perms(GLOBAL5));
    grant(TRANSPORT_ADMIN, perms(GLOBAL5));

    // HRD: can view + update people data (but not delete users, not full system admin)
    grant(HRD, perms(List.of("READ", "UPDATE", "PRINT")));

    // HOD / GM / CHAIRMAN: management dashboard style (mostly read + print reports)
    grant(HOD,       perms(List.of("READ", "PRINT")));
    grant(GM,        perms(List.of("READ", "PRINT")));
    grant(CHAIRMAN,  perms(List.of("READ", "PRINT")));

    // VEHICLE_INCHARGE: can view/update vehicles, print reports
    grant(VEHICLE_INCHARGE, perms(List.of("READ", "UPDATE", "PRINT")));
    grant(TRANSPORT, perms(List.of("READ", "UPDATE", "PRINT")));

    // GATE_SECURITY: can only read (like scanning, logs, etc.)
    grant(GATE_SECURITY, perms(List.of("READ")));

    // STAFF (applicant / normal user): can only read own info
    grant(STAFF, perms(List.of("READ")));

    // ===== 4. EMPLOYEE MASTER DATA (Registration table) =====
    // We create base employee records with EPF numbers
    upsertReg("EPF-0000", "System Admin",          "IT");
    upsertReg("EPF-0001", "Admin Backup One",      "IT");
    upsertReg("EPF-0003", "Auth Service Admin",    "IT");

    upsertReg("EPF-1001", "HRD Person",            "HR");
    upsertReg("EPF-2001", "Head Of Dept User",     "Production");
    upsertReg("EPF-3001", "General Manager User",  "Management");
    upsertReg("EPF-4001", "Company Chairman",      "Board");

    upsertReg("EPF-5001", "Vehicle Incharge User", "Transport");
    upsertReg("EPF-5002", "Transport Admin User",  "Transport");
    upsertReg("EPF-5003", "Transport Officer",     "Transport");
    upsertReg("EPF-6001", "Gate Security One",     "Security");

    upsertReg("EPF-7001", "Normal Staff User",     "Operations");

    Registration rAdmin0   = regRepo.findByEpfNoAndDeletedFalse("EPF-0000").orElseThrow();
    Registration rAuthAdmin= regRepo.findByEpfNoAndDeletedFalse("EPF-0003").orElseThrow();
    Registration rTransportAdmin = regRepo.findByEpfNoAndDeletedFalse("EPF-5002").orElseThrow();

    Registration rHRD      = regRepo.findByEpfNoAndDeletedFalse("EPF-1001").orElseThrow();
    Registration rHOD      = regRepo.findByEpfNoAndDeletedFalse("EPF-2001").orElseThrow();
    Registration rGM       = regRepo.findByEpfNoAndDeletedFalse("EPF-3001").orElseThrow();
    Registration rChair    = regRepo.findByEpfNoAndDeletedFalse("EPF-4001").orElseThrow();

    Registration rVehicle  = regRepo.findByEpfNoAndDeletedFalse("EPF-5001").orElseThrow();
    Registration rTransportStaff = regRepo.findByEpfNoAndDeletedFalse("EPF-5003").orElseThrow();
    Registration rGate     = regRepo.findByEpfNoAndDeletedFalse("EPF-6001").orElseThrow();

    Registration rStaff    = regRepo.findByEpfNoAndDeletedFalse("EPF-7001").orElseThrow();

    // ===== 5. USERS (login accounts) =====
    //
    // NOTE: username + password (dev only). You can change these later.

    // admin / admin123  → ADMIN
    if (userRepo.findByUsername("admin").isEmpty()) {
      User u0 = userRepo.save(User.builder()
          .epfNo(rAdmin0.getEpfNo())
          .username("admin")
          .email("admin@spc.lk")
          .fullName("System Admin")
          .department(rAdmin0.getDepartment())
          .active(true)
          .password(encoder.encode("admin123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(u0, ADMIN);
    }

    // authadmin / AuthAdmin@123 → AUTH_ADMIN
    if (userRepo.findByUsername("authadmin").isEmpty()) {
      User auth = userRepo.save(User.builder()
          .epfNo(rAuthAdmin.getEpfNo())
          .username("authadmin")
          .email("authadmin@spc.lk")
          .fullName("Auth Service Admin")
          .department(rAuthAdmin.getDepartment())
          .active(true)
          .password(encoder.encode("AuthAdmin@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(auth, AUTH_ADMIN);
    }

    // tadmin / TAdmin@123 → TRANSPORT_ADMIN
    if (userRepo.findByUsername("tadmin").isEmpty()) {
      User tAdmin = userRepo.save(User.builder()
          .epfNo(rTransportAdmin.getEpfNo())
          .username("tadmin")
          .email("tadmin@spc.lk")
          .fullName("Transport Admin User")
          .department(rTransportAdmin.getDepartment())
          .active(true)
          .password(encoder.encode("TAdmin@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(tAdmin, TRANSPORT_ADMIN);
    }

    // hrd / Hrd@123  → HRD
    if (userRepo.findByUsername("hrd").isEmpty()) {
      User uHrd = userRepo.save(User.builder()
          .epfNo(rHRD.getEpfNo())
          .username("hrd")
          .email("hrd@spc.lk")
          .fullName("HRD Person")
          .department(rHRD.getDepartment())
          .active(true)
          .password(encoder.encode("Hrd@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uHrd, HRD);
    }

    // hoduser / Hod@123 → HOD
    if (userRepo.findByUsername("hoduser").isEmpty()) {
      User uHod = userRepo.save(User.builder()
          .epfNo(rHOD.getEpfNo())
          .username("hoduser")
          .email("hod@spc.lk")
          .fullName("Head Of Dept User")
          .department(rHOD.getDepartment())
          .active(true)
          .password(encoder.encode("Hod@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uHod, HOD);
    }

    // gmuser / Gm@123 → GM
    if (userRepo.findByUsername("gmuser").isEmpty()) {
      User uGm = userRepo.save(User.builder()
          .epfNo(rGM.getEpfNo())
          .username("gmuser")
          .email("gm@spc.lk")
          .fullName("General Manager User")
          .department(rGM.getDepartment())
          .active(true)
          .password(encoder.encode("Gm@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uGm, GM);
    }

    // chair / Chair@123 → CHAIRMAN
    if (userRepo.findByUsername("chair").isEmpty()) {
      User uChair = userRepo.save(User.builder()
          .epfNo(rChair.getEpfNo())
          .username("chair")
          .email("chairman@spc.lk")
          .fullName("Company Chairman")
          .department(rChair.getDepartment())
          .active(true)
          .password(encoder.encode("Chair@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uChair, CHAIRMAN);
    }

    // vehicle / Vehicle@123 → VEHICLE_INCHARGE
    if (userRepo.findByUsername("vehicle").isEmpty()) {
      User uVeh = userRepo.save(User.builder()
          .epfNo(rVehicle.getEpfNo())
          .username("vehicle")
          .email("vehicle@spc.lk")
          .fullName("Vehicle Incharge User")
          .department(rVehicle.getDepartment())
          .active(true)
          .password(encoder.encode("Vehicle@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uVeh, VEHICLE_INCHARGE);
    }

    // transport1 / Transport@123 → TRANSPORT
    if (userRepo.findByUsername("transport1").isEmpty()) {
      User uTrans = userRepo.save(User.builder()
          .epfNo(rTransportStaff.getEpfNo())
          .username("transport1")
          .email("transport1@spc.lk")
          .fullName("Transport Officer")
          .department(rTransportStaff.getDepartment())
          .active(true)
          .password(encoder.encode("Transport@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uTrans, TRANSPORT);
    }

    // gate1 / Gate1@123 → GATE_SECURITY
    if (userRepo.findByUsername("gate1").isEmpty()) {
      User uGate = userRepo.save(User.builder()
          .epfNo(rGate.getEpfNo())
          .username("gate1")
          .email("gate1@spc.lk")
          .fullName("Gate Security One")
          .department(rGate.getDepartment())
          .active(true)
          .password(encoder.encode("Gate1@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uGate, GATE_SECURITY);
    }

    // staff1 / Staff@123 → STAFF
    if (userRepo.findByUsername("staff1").isEmpty()) {
      User uStaff = userRepo.save(User.builder()
          .epfNo(rStaff.getEpfNo())
          .username("staff1")
          .email("staff1@spc.lk")
          .fullName("Normal Staff User")
          .department(rStaff.getDepartment())
          .active(true)
          .password(encoder.encode("Staff@123"))
          .addedDateTime(LocalDateTime.now())
          .build());
      link(uStaff, STAFF);
    }

    // ===== 6. First audit log =====
    if (auditRepo.count() == 0) {
      auditRepo.save(AuditLog.builder()
          .actor("system")
          .action("SEED")
          .entityType("BOOTSTRAP")
          .entityId("-")
          .details("Seed data")
          .atTime(LocalDateTime.now())
          .build());
    }
  }

  // ---------- helper methods ----------

  private Role role(String code, String name, String desc) {
    return roleRepo.findByCode(code).orElseGet(() ->
        roleRepo.save(Role.builder()
            .code(code)
            .name(name)
            .description(desc)
            .build())
    );
  }

  private Permission perm(String code, String desc) {
    return permRepo.findByCode(code).orElseGet(() ->
        permRepo.save(Permission.builder()
            .code(code)
            .description(desc)
            .build())
    );
  }

  private List<Permission> perms(List<String> codes) {
    List<Permission> out = new ArrayList<>(codes.size());
    for (String c : codes) {
      out.add(perm(c, c));
    }
    return out;
  }

  private void grant(Role role, List<Permission> permissions) {
    for (Permission p : permissions) {
      rolePermRepo.findByRoleAndPermission(role, p)
          .orElseGet(() -> rolePermRepo.save(
              RolePermission.builder()
                  .role(role)
                  .permission(p)
                  .build()
          ));
    }
  }

  private void upsertReg(String epf, String fullName, String dept) {
    regRepo.findByEpfNoAndDeletedFalse(epf).orElseGet(() ->
        regRepo.save(Registration.builder()
            .epfNo(epf)
            .fullName(fullName)
            .department(dept)
            .addedBy("system")
            .addedTime(LocalDateTime.now())
            .deleted(false)
            .build())
    );
  }

  private void link(User user, Role role) {
    userRoleRepo.findByUserAndRole(user, role)
        .orElseGet(() -> userRoleRepo.save(
            UserRole.builder()
                .user(user)
                .role(role)
                .build()
        ));
  }
}
