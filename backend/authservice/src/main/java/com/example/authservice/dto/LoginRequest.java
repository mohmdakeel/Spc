// src/main/java/com/example/authservice/dto/LoginRequest.java
package com.example.authservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {
  private String username;
  private String password;
}