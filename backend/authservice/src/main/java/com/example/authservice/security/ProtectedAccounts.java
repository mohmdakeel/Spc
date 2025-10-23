package com.example.authservice.security;

import java.util.Set;

public final class ProtectedAccounts {
    // Add more usernames here if you ever need to protect more root accounts
    public static final Set<String> PROTECTED_USERNAMES = Set.of("admin1");

    private ProtectedAccounts() {}
}
