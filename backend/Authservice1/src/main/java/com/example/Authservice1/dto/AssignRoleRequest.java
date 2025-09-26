package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class AssignRoleRequest {
    @NotNull private Long userId;
    @NotNull private Long roleId;
    private boolean assign;
}
