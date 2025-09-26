package com.example.Authservice1.service;

import com.example.Authservice1.audit.AuditLog;
import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.repository.AuditLogRepository;
import com.example.Authservice1.repository.PermissionRepository;
import com.example.Authservice1.repository.RoleRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class RoleService {
    private final RoleRepository roles;
    private final PermissionRepository perms;
    private final AuditLogRepository audit;

    public RoleService(RoleRepository roles, PermissionRepository perms, AuditLogRepository audit) {
        this.roles = roles; this.perms = perms; this.audit = audit;
    }

    public Role create(String name, String desc) {
        Role r = new Role();
        r.setName(name.trim().toUpperCase());
        r.setDescription(desc);
        Role saved = roles.save(r);
        log("CREATE_ROLE", "Role", String.valueOf(saved.getId()),
            "{\"name\":\"" + saved.getName() + "\"}");
        return saved;
    }

    public List<Role> findAll() { return roles.findAll(); }

    public Role grantPermission(Long roleId, Long permId, boolean grant) {
        Role r = roles.findById(roleId).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        Permission p = perms.findById(permId).orElseThrow(() -> new IllegalArgumentException("Permission not found"));
        boolean changed = grant ? r.getPermissions().add(p) : r.getPermissions().remove(p);
        if (changed) {
            roles.save(r);
            log(grant ? "GRANT_PERMISSION_TO_ROLE" : "REVOKE_PERMISSION_FROM_ROLE",
                "Role", String.valueOf(r.getId()),
                "{\"permission\":\"" + p.getCode() + "\"}");
        }
        return r;
    }

    public void softDelete(Long id) {
        Role r = roles.findById(id).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        r.setDeleted(true);
        r.setDeletedAt(LocalDateTime.now());
        r.setDeletedBy(currentActor());
        roles.save(r);
        log("DELETE_ROLE", "Role", String.valueOf(id), "{}");
    }

    private String currentActor() {
        var a = SecurityContextHolder.getContext().getAuthentication();
        return a != null ? a.getName() : "system";
    }

    private void log(String action, String entity, String id, String details) {
        AuditLog al = new AuditLog();
        al.setActor(SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "system");
        al.setAction(action);
        al.setEntityName(entity);
        al.setEntityId(id);
        al.setDetailsJson(details);
        audit.save(al);
    }
}
