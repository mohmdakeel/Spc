// src/main/java/com/example/authservice/config/AuditingConfig.java
package com.example.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            // no auth in context at all (e.g. startup seeding, background jobs)
            if (auth == null) {
                return Optional.of("system");
            }

            // not actually logged in (anonymous etc.)
            if (!auth.isAuthenticated()) {
                return Optional.of("system");
            }

            String name = auth.getName();
            if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
                return Optional.of("system");
            }

            return Optional.of(name);
        };
    }
}
