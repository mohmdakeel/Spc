package com.example.Authservice1.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor
public class TransferPermissionsRequest {
    @NotNull private Long fromUserId;
    @NotNull private Long toUserId;
    private boolean includeRolePermissions = true;
    private boolean clearFromUser = true;
}
