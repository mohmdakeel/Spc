package com.example.authservice.util;

import com.example.authservice.config.AppProps;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class CookieUtils {

  private final AppProps props;

  public ResponseCookie buildJwtCookie(String token) {
    var c = props.getCookie();
    var maxAge = Duration.ofMinutes(props.getJwt().getExpiryMinutes());

    var b = ResponseCookie.from(c.getName(), token)
        // do NOT force Domain=localhost – only set if non-localhost
        .httpOnly(c.isHttpOnly())
        .secure(c.isSecure())        // for dev over http, set secure=false in properties
        .sameSite(c.getSameSite())   // e.g. "Lax"
        .path("/")
        .maxAge(maxAge);

    if (c.getDomain() != null && !c.getDomain().isBlank()
        && !"localhost".equalsIgnoreCase(c.getDomain())) {
      b.domain(c.getDomain());
    }
    return b.build();
  }

  public ResponseCookie clearJwtCookie() {
    var c = props.getCookie();

    var b = ResponseCookie.from(c.getName(), "")
        .httpOnly(c.isHttpOnly())
        .secure(c.isSecure())
        .sameSite(c.getSameSite())
        .path("/")
        .maxAge(0);

    if (c.getDomain() != null && !c.getDomain().isBlank()
        && !"localhost".equalsIgnoreCase(c.getDomain())) {
      b.domain(c.getDomain());
    }
    return b.build();
  }
}
