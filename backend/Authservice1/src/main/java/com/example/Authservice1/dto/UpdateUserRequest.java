package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class UpdateUserRequest {
    @Email @NotBlank private String email;
    private String fullName; private String department; private String designation;
    private String contactNo; private String company; private String remarks;
    private Boolean active;
}
