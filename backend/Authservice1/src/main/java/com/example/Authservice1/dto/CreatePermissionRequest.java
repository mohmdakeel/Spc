package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class CreatePermissionRequest {
    @NotBlank private String code;
    private String description;
}
