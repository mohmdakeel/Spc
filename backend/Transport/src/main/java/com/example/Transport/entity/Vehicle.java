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
@Table(name = "vehicle")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_number", nullable = false, unique = true)
    @NotBlank(message = "Vehicle number is mandatory")
    private String vehicleNumber;

    private String vehicleType;
    private String brand;
    private String model;

    @Column(unique = true)
    private String chassisNumber;

    @Column(unique = true)
    private String engineNumber;

    private Date manufactureDate;
    private Integer totalKmDriven;
    private Double fuelEfficiency;
    private String presentCondition;
    private String status;

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

    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }

    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }
}
