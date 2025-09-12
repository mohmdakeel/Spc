package com.example.Transport.entity;

import com.example.Transport.enums.VehicleStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;               // JPA Id (correct one)
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

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
@Table(name = "vehicles")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique business key */
    @NotBlank(message = "Vehicle number is mandatory")
    @Column(nullable = false, unique = true)
    private String vehicleNumber;

    /** Keep type as string to match your current DB/UI (e.g., CAR, VAN, LORRY) */
    private String vehicleType;

    private String brand;
    private String model;

    private String chassisNumber;
    private String engineNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Temporal(TemporalType.DATE)
    private Date manufactureDate;

    private Long totalKmDriven;     // odometer
    private Double fuelEfficiency;  // km per liter (or your unit)

    /** Free text: e.g., "Good", "Needs service", etc. */
    private String presentCondition;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    /** Soft delete */
    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted = 0;  // 0=active, 1=deleted

    /** Auditing */
    @CreatedBy        @Column(updatable = false) private String createdBy;
    @CreatedDate      @Column(updatable = false) private Date createdAt;
    @LastModifiedBy   private String updatedBy;
    @LastModifiedDate private Date updatedAt;

    /** Soft delete metadata */
    private String deletedBy;
    private Date deletedAt;

    // JSON-friendly helpers (same pattern as Driver for front-end consistency)
    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }
    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }
}
