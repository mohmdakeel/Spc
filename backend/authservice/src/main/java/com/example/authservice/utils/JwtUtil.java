package com.example.authservice.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;  // at least 32 chars for HS256

    @Value("${jwt.expiration:86400000}") // default 24h
    private long expirationMillis;

    private Key signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // === Generate (0.11.5 style) ===
    public String generateToken(@NotBlank String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(username)                         // <-- setSubject (not subject)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMillis))
                .signWith(signingKey(), SignatureAlgorithm.HS256) // <-- pass alg explicitly
                .compact();
    }

    // === Extract ===
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseAllClaims(token));
    }

    private Claims parseAllClaims(String token) {
        return Jwts.parserBuilder()                  // <-- parserBuilder (not parser)
                .setSigningKey(signingKey())         // <-- setSigningKey (not verifyWith)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // === Validate ===
    public boolean isTokenValid(String token, String expectedUsername) {
        String subject = extractUsername(token);
        return subject.equals(expectedUsername) && !isExpired(token);
    }

    private boolean isExpired(String token) {
        Date exp = extractClaim(token, Claims::getExpiration);
        return exp.before(new Date());
    }
}
