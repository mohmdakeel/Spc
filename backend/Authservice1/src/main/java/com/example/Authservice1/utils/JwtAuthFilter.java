package com.example.Authservice1.utils;

import com.example.Authservice1.model.Permission;
import com.example.Authservice1.model.Role;
import com.example.Authservice1.model.User;
import com.example.Authservice1.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtil.extractUsername(token);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findByUsername(username).orElse(null);
                    if (user != null && jwtUtil.isTokenValid(token, username)) {
                        Set<GrantedAuthority> authorities = new HashSet<>();
                        authorities.addAll(user.getRoles().stream()
                                .map(Role::getName)
                                .map(rn -> new SimpleGrantedAuthority("ROLE_" + rn))
                                .collect(Collectors.toSet()));
                        user.getRoles().forEach(r -> r.getPermissions().forEach(p ->
                                authorities.add(new SimpleGrantedAuthority("PERM_" + p.getCode()))));
                        user.getDirectPermissions().forEach((Permission p) ->
                                authorities.add(new SimpleGrantedAuthority("PERM_" + p.getCode())));

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(username, null, authorities);
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (JwtException | IllegalArgumentException e) {
                // ignore invalid tokens
            }
        }
        chain.doFilter(request, response);
    }
}
