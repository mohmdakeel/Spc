package com.example.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @Email(message = "Email must be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "EPF No is required")
    private String epfNo;

    // optional fields
    private String department;
    private String designation;
    private String contactNo;
    private String company;
    private String copyFromPrivileges;
    private String remarks;

    @NotBlank(message = "Role is required")
    private String role; // e.g. ADMIN, STAFF, USER
}
