package com.example.Transport.entity;

import com.example.Transport.enums.DriverStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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
    @Column(name = "employee_id", nullable = false, updatable = false)
    @NotBlank(message = "Employee ID is mandatory")
    private String employeeId;

    @NotBlank(message = "Name is mandatory")
    private String name;

    private String phone;
    private String email;

    @NotBlank(message = "License number is mandatory")
    private String licenseNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Temporal(TemporalType.DATE)
    @Column(name = "license_expiry_date")
    private Date licenseExpiryDate;

    private Integer drivingExperience;

    @Enumerated(EnumType.STRING)
    private DriverStatus status;

    /** Soft delete flag */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Integer isDeleted = 0; // 0 = active, 1 = deleted

    /** Auditing fields */
    @CreatedBy @Column(updatable = false) private String createdBy;
    @CreatedDate @Column(updatable = false) private Date createdAt;
    @LastModifiedBy private String updatedBy;
    @LastModifiedDate private Date updatedAt;

    private String deletedBy;
    private Date deletedAt;

    // JSON-friendly helpers
    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }
    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }

    @PrePersist
    public void prePersist() {
        if (isDeleted == null) {
            isDeleted = 0;
        }
    }
}
