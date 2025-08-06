package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.validation.constraints.NotBlank;

import java.util.Date;

@Entity
@Table(name = "drivers")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @Column(name = "employee_id")
    @NotBlank(message = "Employee ID is mandatory")
    private String employeeId;

    @NotBlank(message = "Name is mandatory")
    private String name;

    private String phone;
    private String email;

    @NotBlank(message = "License number is mandatory")
    private String licenseNumber;

    // ✅ Use Integer instead of Boolean/boolean
    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted;

    @CreatedBy
    private String createdBy;

    @CreatedDate
    private Date createdAt;

    @LastModifiedBy
    private String updatedBy;

    @LastModifiedDate
    private Date updatedAt;

    private String deletedBy;
    private Date deletedAt;

    // ✅ This lets JSON use "deleted": true/false
    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }

    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }
}

