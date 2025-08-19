package com.example.Transport.entity;

import com.example.Transport.enums.DriverStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
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

    @JsonFormat(pattern = "yyyy-MM-dd") // <--- THIS FIXES YOUR ERROR!
    @Temporal(TemporalType.DATE)
    @Column(name = "license_expiry_date")
    private Date licenseExpiryDate;

    @Column(name = "driving_experience")
    private Integer drivingExperience;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DriverStatus status; // <-- enum!

    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted = 0; // 0 = active, 1 = deleted

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

    // Helper for JSON boolean compatibility
    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }

    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }
}
