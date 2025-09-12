package com.example.Transport.util;

import com.example.Transport.enums.UserRole;

import java.util.EnumSet;

public final class RoleGuard {
    private RoleGuard() {}

    public static void require(String roleHeader, EnumSet<UserRole> allowed) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new IllegalArgumentException("Missing X-Role header");
        }
        final UserRole role;
        try {
            role = UserRole.valueOf(roleHeader.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role: " + roleHeader);
        }
        if (!allowed.contains(role)) {
            throw new IllegalArgumentException("Forbidden for role: " + role);
        }
    }
}
