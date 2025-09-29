package com.example.Authservice1.service;

import com.example.Authservice1.audit.AuditLog;
import com.example.Authservice1.dto.AuthRequest;
import com.example.Authservice1.dto.AuthResponse;
import com.example.Authservice1.dto.CreateUserRequest;
import com.example.Authservice1.dto.RegisterRequest;
import com.example.Authservice1.dto.UpdateUserRequest;
import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;
import com.example.Authservice1.repository.AuditLogRepository;
import com.example.Authservice1.repository.PermissionRepository;
import com.example.Authservice1.repository.RoleRepository;
import com.example.Authservice1.repository.UserRepository;
import com.example.Authservice1.utils.JwtUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;
    private final AuditLogRepository audit;
    private final PermissionRepository perms;

    public UserService(UserRepository users, RoleRepository roles, PasswordEncoder encoder,
                       JwtUtil jwt, AuditLogRepository audit, PermissionRepository perms) {
        this.users = users; this.roles = roles; this.encoder = encoder; this.jwt = jwt; this.audit = audit; this.perms = perms;
    }

    // ---------- Auth / Register ----------
    public String register(RegisterRequest req, Optional<String> roleNameOpt) {
        if (users.findByUsername(req.getUsername()).isPresent()) return "Username already taken";
        if (users.findByEmail(req.getEmail()).isPresent()) return "Email already registered";

        User u = new User();
        u.setUsername(req.getUsername());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setFullName(req.getFullName());
        u.setDepartment(req.getDepartment());
        u.setDesignation(req.getDesignation());
        u.setContactNo(req.getContactNo());
        u.setCompany(req.getCompany());
        u.setRemarks(req.getRemarks());
        u.setActive(true);

        roleNameOpt.ifPresent(roleName -> {
            Role r = roles.findByName(roleName.toUpperCase())
                    .orElseThrow(() -> new IllegalArgumentException("Role not found"));
            u.getRoles().add(r);
        });

        users.save(u);
        log("CREATE_USER", "User", String.valueOf(u.getId()),
                "{\"username\":\"" + u.getUsername() + "\"}");
        return "User registered successfully";
    }

    public AuthResponse login(AuthRequest req) {
        User u = users.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!encoder.matches(req.getPassword(), u.getPassword()))
            throw new IllegalArgumentException("Invalid username or password");
        String token = jwt.generateToken(u.getUsername());
        return new AuthResponse(token);
    }

    // ---------- Listing / Paging (in-memory so repo custom methods வேண்டாம்) ----------
    public Page<User> page(Pageable pageable, String q) {
        String qq = (q == null || q.isBlank()) ? null : q.toLowerCase();
        List<User> all = users.findAll().stream()
                .filter(u -> !u.isDeleted())
                .filter(u -> qq == null || matchesUserQuery(u, qq))
                .sorted(Comparator.comparing(User::getId))
                .toList();

        int start = Math.min((int) pageable.getOffset(), all.size());
        int end   = Math.min(start + pageable.getPageSize(), all.size());
        List<User> content = all.subList(start, end);
        return new PageImpl<>(content, pageable, all.size());
    }

    public List<User> listForExport(String q, String fromStr, String toStr, String role) {
        LocalDateTime from = parseStart(fromStr);
        LocalDateTime to   = parseEnd(toStr);
        String qq = (q == null || q.isBlank()) ? null : q.toLowerCase();
        String rr = (role == null || role.isBlank()) ? null : role.trim().toUpperCase();

        return users.findAll().stream()
                .filter(u -> !u.isDeleted())
                .filter(u -> qq == null || matchesUserQuery(u, qq))
                .filter(u -> rr == null || hasRole(u, rr))
                .filter(u -> between(u.getCreatedAt(), from, to))
                .sorted(Comparator.comparing(User::getId))
                .toList();
    }

    private boolean matchesUserQuery(User u, String q) {
        return str(u.getUsername()).contains(q)
            || str(u.getEmail()).contains(q)
            || str(u.getFullName()).contains(q)
            || str(u.getDepartment()).contains(q)
            || str(u.getDesignation()).contains(q)
            || str(u.getCompany()).contains(q)
            || str(u.getContactNo()).contains(q);
    }
    private boolean hasRole(User u, String roleUpper) {
        return u.getRoles().stream().anyMatch(r -> roleUpper.equals(r.getName()));
    }
    private String str(String s) { return s == null ? "" : s.toLowerCase(); }
    private boolean between(LocalDateTime t, LocalDateTime from, LocalDateTime to) {
        if (t == null) return true;
        if (from != null && t.isBefore(from)) return false;
        if (to   != null && !t.isBefore(to))  return false; // [from, to)
        return true;
    }
    private LocalDateTime parseStart(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return null;
        try { return LocalDate.parse(isoDate).atStartOfDay(); }
        catch (DateTimeParseException e) { return null; }
    }
    private LocalDateTime parseEnd(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return null;
        try { return LocalDate.parse(isoDate).plusDays(1).atStartOfDay(); }
        catch (DateTimeParseException e) { return null; }
    }

    // ---------- Admin CRUD / Assign ----------
    public List<User> all() { return users.findAll(); }

    public User createEmployee(CreateUserRequest req) {
        if (users.findByUsername(req.getUsername()).isPresent())
            throw new IllegalArgumentException("Username already taken");
        if (users.findByEmail(req.getEmail()).isPresent())
            throw new IllegalArgumentException("Email already registered");

        User u = new User();
        u.setUsername(req.getUsername());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setFullName(req.getFullName());
        u.setDepartment(req.getDepartment());
        u.setDesignation(req.getDesignation());
        u.setContactNo(req.getContactNo());
        u.setCompany(req.getCompany());
        u.setRemarks(req.getRemarks());
        u.setActive(true);

        if (req.getRoleNames()!=null) {
            req.getRoleNames().forEach(rn -> {
                Role r = roles.findByName(rn.trim().toUpperCase())
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + rn));
                u.getRoles().add(r);
            });
        }
        if (req.getPermissionCodes()!=null) {
            req.getPermissionCodes().forEach(code -> {
                Permission p = perms.findByCode(code.trim().toUpperCase())
                        .orElseThrow(() -> new IllegalArgumentException("Permission not found: " + code));
                u.getDirectPermissions().add(p);
            });
        }

        users.save(u);
        log("CREATE_USER", "User", String.valueOf(u.getId()),
                "{\"username\":\"" + u.getUsername() + "\"}");
        return u;
    }

    public User update(Long id, UpdateUserRequest req) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setEmail(req.getEmail());
        u.setFullName(req.getFullName());
        u.setDepartment(req.getDepartment());
        u.setDesignation(req.getDesignation());
        u.setContactNo(req.getContactNo());
        u.setCompany(req.getCompany());
        u.setRemarks(req.getRemarks());
        if (req.getActive()!=null) u.setActive(req.getActive());
        users.save(u);
        log("UPDATE_USER", "User", String.valueOf(u.getId()),
                "{\"email\":\"" + u.getEmail() + "\"}");
        return u;
    }

    public String softDelete(Long id) {
        User u = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setDeleted(true);
        u.setActive(false);
        users.save(u);
        log("DELETE_USER", "User", String.valueOf(u.getId()), "{}");
        return "User deleted successfully";
    }

    public User assignRole(Long userId, Long roleId, boolean assign) {
        User u = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role r = roles.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        boolean changed = assign ? u.getRoles().add(r) : u.getRoles().remove(r);
        if (changed) {
            users.save(u);
            log(assign ? "ASSIGN_ROLE" : "REMOVE_ROLE", "User", String.valueOf(u.getId()),
                    "{\"role\":\"" + r.getName() + "\"}");
        }
        return u;
    }

    // ---------- audit helper ----------
    private void log(String action, String entity, String id, String details) {
        AuditLog al = new AuditLog();
        var a = SecurityContextHolder.getContext().getAuthentication();
        al.setActor(a != null ? a.getName() : "system");
        al.setAction(action);
        al.setEntityName(entity);
        al.setEntityId(id);
        al.setDetailsJson(details);
        audit.save(al);
    }
}
