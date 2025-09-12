package com.example.Transport.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // run early
public class ActorFilter extends OncePerRequestFilter {
    private final RequestActorHolder holder;

    public ActorFilter(RequestActorHolder holder) {
        this.holder = holder;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        try {
            String actor = Optional.ofNullable(req.getHeader("X-Actor"))
                                   .filter(s -> !s.isBlank())
                                   .orElse("system");
            holder.set(actor);
            chain.doFilter(req, res);
        } finally {
            holder.clear();
        }
    }
}
