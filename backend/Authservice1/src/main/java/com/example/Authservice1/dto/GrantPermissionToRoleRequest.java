package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class GrantPermissionToRoleRequest {
    @NotNull private Long roleId;
    @NotNull private Long permissionId;
    private boolean grant; // true=grant, false=revoke
}
