// src/main/java/com/example/authservice/dto/ChangePasswordRequest.java
package com.example.authservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChangePasswordRequest {
  private String oldPassword;
  private String newPassword;
}