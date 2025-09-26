package com.example.Authservice1.controller;

import com.example.Authservice1.dto.AssignRoleRequest;
import com.example.Authservice1.dto.TransferPermissionsRequest;
import com.example.Authservice1.model.User;
import com.example.Authservice1.service.AssignmentService;
import com.example.Authservice1.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/assign")
public class AssignmentController {
    private final UserService users;
    private final AssignmentService assign;

    public AssignmentController(UserService users, AssignmentService assign) {
        this.users = users; this.assign = assign;
    }

    @PostMapping("/role")
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public User userRole(@Valid @RequestBody AssignRoleRequest req) {
        return users.assignRole(req.getUserId(), req.getRoleId(), req.isAssign());
    }

    @PostMapping("/transfer-permissions")
    @PreAuthorize("hasAuthority('PERM_ROLE_ADMIN') or hasRole('ADMIN')")
    public String transfer(@Valid @RequestBody TransferPermissionsRequest req) {
        assign.transferPermissions(req.getFromUserId(), req.getToUserId(),
                req.isIncludeRolePermissions(), req.isClearFromUser());
        return "Permissions transferred.";
    }
}
