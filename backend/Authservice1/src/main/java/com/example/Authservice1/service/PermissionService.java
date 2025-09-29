package com.example.Authservice1.service;

import com.example.Authservice1.audit.AuditLog;
import com.example.Authservice1.model.Permission;
import com.example.Authservice1.repository.AuditLogRepository;
import com.example.Authservice1.repository.PermissionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PermissionService {
    private final PermissionRepository repo;
    private final AuditLogRepository audit;

    public PermissionService(PermissionRepository repo, AuditLogRepository audit) {
        this.repo = repo; this.audit = audit;
    }

    public Permission create(String code, String description) {
        Permission p = new Permission(null, code.trim().toUpperCase(), description);
        Permission saved = repo.save(p);
        log("CREATE_PERMISSION", "Permission", String.valueOf(saved.getId()),
            "{\"code\":\"" + saved.getCode() + "\"}");
        return saved;
    }

    public List<Permission> all() { return repo.findAll(); }

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
