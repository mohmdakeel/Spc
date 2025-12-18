// Transport/src/main/java/com/example/Transport/config/JwtAuthConverter.java
package com.example.Transport.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Collection<SimpleGrantedAuthority> auths = new ArrayList<>();

    List<String> roles = asList(jwt.getClaim("roles"));
    for (String r : roles) auths.add(new SimpleGrantedAuthority("ROLE_" + r));

    List<String> perms = asList(jwt.getClaim("permissions"));
    for (String p : perms) auths.add(new SimpleGrantedAuthority(p));

    String name = Optional.ofNullable(jwt.getClaimAsString("sub"))
                          .orElse(jwt.getClaimAsString("username"));
    return new JwtAuthenticationToken(jwt, auths, name);
  }

  @SuppressWarnings("unchecked")
  private static List<String> asList(Object v) {
    if (v instanceof Collection<?> c) return c.stream().map(Object::toString).toList();
    if (v instanceof String s) return List.of(s);
    return List.of();
  }
}
