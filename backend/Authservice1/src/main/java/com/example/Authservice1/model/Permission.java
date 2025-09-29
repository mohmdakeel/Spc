package com.example.Authservice1.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name="permission", uniqueConstraints=@UniqueConstraint(name="uk_permission_code", columnNames="code"))
public class Permission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Column(nullable=false, length=64)
    private String code;

    @Column(length=256)
    private String description;
}
