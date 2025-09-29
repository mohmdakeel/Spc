package com.example.Authservice1.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

@Data
public class CreateUserRequest {
    @NotBlank private String username;
    @Email @NotBlank private String email;
    @NotBlank @Size(min=6) private String password;

    private String fullName; private String department; private String designation;
    private String contactNo; private String company; private String remarks;

    private Set<String> roleNames;
    private Set<String> permissionCodes;
}
