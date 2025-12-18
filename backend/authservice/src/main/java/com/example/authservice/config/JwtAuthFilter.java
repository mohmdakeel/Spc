package com.example.authservice.config;

import com.example.authservice.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtService jwt;
  private final @Lazy UserDetailsService uds;   // <-- lazy
  private final AppProps props;

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {

    String token = null;

    if (req.getCookies() != null) {
      token = Arrays.stream(req.getCookies())
          .filter(c -> props.getCookie().getName().equals(c.getName()))
          .map(Cookie::getValue)
          .findFirst().orElse(null);
    }

    if (token == null) {
      String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
      if (auth != null && auth.startsWith("Bearer ")) token = auth.substring(7);
    }

    if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      String username = jwt.getUsername(token);
      if (username != null && jwt.validate(token)) {
        UserDetails ud = uds.loadUserByUsername(username);
        var auth = new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    }

    chain.doFilter(req, res);
  }
}
