package com.example.authservice.security;

import java.util.Set;

public final class ProtectedAccounts {

    // Only super root you NEVER want modified/deleted
    public static final Set<String> PROTECTED_USERNAMES = Set.of("admin");

    private ProtectedAccounts() {}
}
