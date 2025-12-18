// src/main/java/com/example/authservice/dto/CreateUserFromEmployeeRequest.java
package com.example.authservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CreateUserFromEmployeeRequest {
  private String username;
  private String email;
  private String password;
  private String role;
}