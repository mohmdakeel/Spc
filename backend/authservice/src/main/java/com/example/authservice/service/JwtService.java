package com.example.authservice.service;

import com.example.authservice.config.AppProps;
import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtService {
  private final AppProps props;
  private final UserRepository users;
  private final UserService userService;

  private Key key() {
    // HS256 works with shorter dev secrets. For HS512, use a >=64-char secret and change algorithm below.
    return Keys.hmacShaKeyFor(props.getJwt().getSecret().getBytes());
  }

  public String create(String username) {
    User user = users.findByUsername(username).orElseThrow();
    var roleCodes = users.findAuthorities(user.getId());
    var permissions = userService.effectivePermissionCodes(user.getId());

    Instant now = Instant.now();
    Instant exp = now.plusSeconds(props.getJwt().getExpiryMinutes() * 60L);
    return Jwts.builder()
        .setSubject(username)
        .setIssuer(props.getJwt().getIssuer())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(exp))
        .claim("userId", user.getId())
        .claim("roles", roleCodes)
        .claim("permissions", permissions)
        .signWith(key(), SignatureAlgorithm.HS256)   // ✅ HS256 for current secret
        .compact();
  }

  public String getUsername(String token) {
    try {
      return Jwts.parserBuilder()
          .setSigningKey(key())
          .build()
          .parseClaimsJws(token)
          .getBody()
          .getSubject();
    } catch (Exception e) {
      return null;
    }
  }

  public boolean validate(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  // 🔹 Used by /api/auth-ext/validate
  public String validateAndGetUsername(String token) {
    var claims = Jwts.parserBuilder()
        .setSigningKey(key())
        .build()
        .parseClaimsJws(token)
        .getBody();
    return claims.getSubject();
  }
}
