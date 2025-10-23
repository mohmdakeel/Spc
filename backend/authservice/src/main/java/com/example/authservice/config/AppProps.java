// src/main/java/com/example/authservice/config/AppProps.java
package com.example.authservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class AppProps {

  private Jwt jwt = new Jwt();
  private Cookie cookie = new Cookie();

  @Data
  public static class Jwt {
    private String secret;
    private String issuer;
    private int expiryMinutes;
  }

  @Data
  public static class Cookie {
    private String name;
    private String domain;
    private String sameSite;
    private boolean secure;
    private boolean httpOnly;
  }
}