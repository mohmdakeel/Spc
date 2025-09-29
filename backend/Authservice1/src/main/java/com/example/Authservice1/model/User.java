package com.example.Authservice1.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "app_user", indexes = @Index(name = "idx_user_username", columnList = "username"))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 128)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    private String fullName;
    private String department;
    private String designation;
    private String contactNo;
    private String company;
    private String remarks;

    private boolean active = true;
    private boolean deleted = false;

    @CreatedDate  private LocalDateTime createdAt;
    @CreatedBy    private String       createdBy;
    @LastModifiedDate private LocalDateTime updatedAt;
    @LastModifiedBy   private String       updatedBy;
    private LocalDateTime deletedAt;
    private String deletedBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_permission",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> directPermissions = new HashSet<>();
}
