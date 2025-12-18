package com.example.Transport.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ActorProvider {

  public String currentActor() {
    SecurityContext context = SecurityContextHolder.getContext();
    if (context == null) {
      return "system";
    }

    Authentication authentication = context.getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return "system";
    }

    String name = authentication.getName();
    return StringUtils.hasText(name) ? name : "system";
  }
}
