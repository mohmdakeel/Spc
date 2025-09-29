package com.example.Authservice1.service;

import com.example.Authservice1.audit.AuditLog;
import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;
import com.example.Authservice1.repository.AuditLogRepository;
import com.example.Authservice1.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssignmentService {
    private final UserRepository users;
    private final AuditLogRepository audit;

    public AssignmentService(UserRepository users, AuditLogRepository audit) {
        this.users = users; this.audit = audit;
    }

    public void transferPermissions(Long fromUserId, Long toUserId,
                                    boolean includeRolePermissions, boolean clearFromUser) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("fromUserId and toUserId cannot be same");
        }
        User from = users.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("Source user not found"));
        User to   = users.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        if (includeRolePermissions) {
            to.getRoles().addAll(from.getRoles());
        }
        to.getDirectPermissions().addAll(from.getDirectPermissions());
        users.save(to);

        if (clearFromUser) {
            if (includeRolePermissions) from.getRoles().clear();
            from.getDirectPermissions().clear();
            users.save(from);
        }

        String actor = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "system";

        String details = String.format(
                "{\"from\":%d,\"to\":%d,\"includeRolePermissions\":%b,\"cleared\":%b}",
                fromUserId, toUserId, includeRolePermissions, clearFromUser);

        AuditLog al = new AuditLog();
        al.setActor(actor);
        al.setAction("TRANSFER_PERMISSIONS");
        al.setEntityName("User");
        al.setEntityId(String.valueOf(toUserId));
        al.setDetailsJson(details);
        audit.save(al);
    }

    public Set<String> getEffectivePermissionCodes(User u) {
        Set<String> rolePerms = u.getRoles().stream()
                .flatMap((Role r) -> r.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        Set<String> direct = u.getDirectPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        rolePerms.addAll(direct);
        return rolePerms;
    }
}
