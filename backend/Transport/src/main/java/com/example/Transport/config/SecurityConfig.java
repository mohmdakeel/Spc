package com.example.Transport.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpHeaders;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// your existing converter: Converter<Jwt, AbstractAuthenticationToken>
import com.example.Transport.config.JwtAuthConverter;

@Configuration
public class SecurityConfig {

  private static final String COOKIE_NAME = "SPC_JWT";

  // must match Auth service
  @Value("${app.jwt.secret}")
  private String jwtSecret;

  // optional issuer check (keep blank to skip)
  @Value("${app.jwt.issuer:}")
  private String issuer;

  private final JwtAuthConverter customJwtConverter;

  public SecurityConfig(JwtAuthConverter customJwtConverter) {
    this.customJwtConverter = customJwtConverter;
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    http
      .cors(c -> c.configurationSource(corsConfigurationSource()))
      .csrf(csrf -> csrf.disable())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .formLogin(f -> f.disable())
      .httpBasic(h -> h.disable())
      .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json");
        res.getWriter().write("{\"error\":\"unauthorized\"}");
      }))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**", "/actuator/**").permitAll()
        .anyRequest().authenticated()
      )
      // ✅ Accept JWT from Authorization header OR SPC_JWT cookie
      .oauth2ResourceServer(oauth -> oauth
        .bearerTokenResolver(cookieAwareBearerTokenResolver())
        .jwt(jwt -> jwt
          .jwtAuthenticationConverter(customJwtConverter) // <-- use your converter directly
          .decoder(jwtDecoder())
        )
      );

    return http.build();
  }

  // ---- HS256 JwtDecoder (shared secret) ----
  @Bean
  JwtDecoder jwtDecoder() {
    // supports secrets like "base64:xxxxx" or plain
    String secretToUse = jwtSecret.startsWith("base64:")
        ? new String(java.util.Base64.getDecoder().decode(jwtSecret.substring(7)), StandardCharsets.UTF_8)
        : jwtSecret;

    SecretKeySpec key = new SecretKeySpec(secretToUse.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).build();

    OAuth2TokenValidator<Jwt> validator =
        (issuer == null || issuer.isBlank())
            ? JwtValidators.createDefault()
            : JwtValidators.createDefaultWithIssuer(issuer);

    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validator));
    return decoder;
  }

  // ---- Read token from header; if missing, fall back to cookie ----
  @Bean
  BearerTokenResolver cookieAwareBearerTokenResolver() {
    return request -> {
      String header = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (header != null && header.startsWith("Bearer ")) {
        return header.substring(7);
      }
      Cookie[] cookies = request.getCookies();
      if (cookies != null) {
        for (Cookie c : cookies) {
          if (COOKIE_NAME.equals(c.getName())) return c.getValue();
        }
      }
      return null;
    };
  }

  // ---- CORS used by Spring Security ----
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:3000"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
