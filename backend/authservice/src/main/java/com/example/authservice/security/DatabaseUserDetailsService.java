package com.example.authservice.security;

import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import com.example.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DatabaseUserDetailsService implements UserDetailsService {

  private final UserRepository users;
  private final @Lazy UserService userService;  // <-- lazy

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    String identifier = username == null ? "" : username.trim();
    var u = users.findByUsername(identifier)
        .or(() -> users.findByEmailIgnoreCase(identifier))
        .filter(User::isActive)                  // still require active
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    List<SimpleGrantedAuthority> auths = new ArrayList<>();

    // roles -> ROLE_CODE
    for (String rc : users.findAuthorities(u.getId())) {
      auths.add(new SimpleGrantedAuthority("ROLE_" + rc));
    }

    // effective permission codes
    for (String pc : userService.effectivePermissionCodes(u.getId())) {
      auths.add(new SimpleGrantedAuthority(pc));
    }

    return org.springframework.security.core.userdetails.User
        .withUsername(u.getUsername())
        .password(u.getPassword())
        .authorities(auths)
        .accountExpired(false)
        .accountLocked(u.isLocked())          // 🔹 use locked flag
        .credentialsExpired(false)
        .disabled(!u.isActive())              // 🔹 use active flag
        .build();
  }
}
