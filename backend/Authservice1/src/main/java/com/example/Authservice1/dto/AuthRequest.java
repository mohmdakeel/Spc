package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class AuthRequest {
    @NotBlank private String username;
    @NotBlank private String password;
}
