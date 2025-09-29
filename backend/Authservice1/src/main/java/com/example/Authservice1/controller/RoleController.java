package com.example.Authservice1.controller;

import com.example.Authservice1.dto.CreateRoleRequest;
import com.example.Authservice1.dto.GrantPermissionToRoleRequest;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roles;

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public Role create(@Valid @RequestBody CreateRoleRequest req) {
        return roles.create(req.getName(), req.getDescription());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public List<Role> all() {
        return roles.findAll();
    }

    @PostMapping("/grant")
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public Role grant(@Valid @RequestBody GrantPermissionToRoleRequest req) {
        return roles.grantPermission(req.getRoleId(), req.getPermissionId(), req.isGrant());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roles.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
