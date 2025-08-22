package com.example.authservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "epf_no", nullable = false, length = 64)
    private String epfNo;

    @NotBlank
    private String username;

    @NotBlank
    private String email;

    @NotBlank
    private String password;

    private String fullName;
    private String department;
    private String designation;
    private String contactNo;
    private String company;
    private String copyFromPrivileges;
    private String remarks;
    private boolean active = true;

    @NotBlank
    private String role; // ADMIN / STAFF / USER

    /** Audit fields */
    private LocalDateTime addedDateTime;
    private String addedBy;

    private LocalDateTime modifiedDateTime;
    private String modifiedBy;

    private LocalDateTime deletedDateTime;
    private String deletedBy;

    /** Read-only relation using business key epf_no */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "epf_no",
            referencedColumnName = "epf_no",
            insertable = false,
            updatable = false
    )
    private Registration registration;
}
