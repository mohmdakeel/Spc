package com.example.Authservice1.controller;

import com.example.Authservice1.dto.CreatePermissionRequest;
import com.example.Authservice1.model.Permission;
import com.example.Authservice1.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/api/permissions")
public class PermissionController {
    private final PermissionService perms;
    public PermissionController(PermissionService perms) { this.perms = perms; }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public Permission create(@Valid @RequestBody CreatePermissionRequest req) {
        return perms.create(req.getCode(), req.getDescription());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_USER_READ') or hasRole('ADMIN')")
    public List<Permission> all() { return perms.all(); }
}
