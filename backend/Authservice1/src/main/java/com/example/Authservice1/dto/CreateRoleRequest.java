package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class CreateRoleRequest {
    @NotBlank private String name;
    private String description;
}
