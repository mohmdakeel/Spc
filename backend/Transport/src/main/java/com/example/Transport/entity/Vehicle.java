package com.example.Transport.entity;

import com.example.Transport.enums.VehicleStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@Entity
@Table(
    name = "vehicles",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_vehicle_number_is_deleted",
            columnNames = {"vehicle_number", "is_deleted"}
        )
    },
    indexes = {
        @Index(name = "ix_vehicle_number", columnList = "vehicle_number"),
        @Index(name = "ix_is_deleted", columnList = "is_deleted")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // ✅ Primary key

    /** Unique business key (soft-delete safe with composite constraint) */
    @NotBlank(message = "Vehicle number is mandatory")
    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;

    /** Type like CAR, VAN, LORRY */
    private String vehicleType;

    private String brand;
    private String model;

    private String chassisNumber;
    private String engineNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Temporal(TemporalType.DATE)
    private Date manufactureDate;

    /** Odometer at registration time (kept for audit/printing) */
    @Column(name = "registered_km")
    private Long registeredKm;

    private Long totalKmDriven;     // odometer
    private Double fuelEfficiency;  // km per liter (or unit)

    /** Free text: e.g., "Good", "Needs service" */
    private String presentCondition;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    /** Soft delete: 0=active, 1=deleted */
    @Column(name = "is_deleted", nullable = false)
    private Integer isDeleted = 0;

    /** Auditing */
    @CreatedBy        @Column(updatable = false) private String createdBy;
    @CreatedDate      @Column(updatable = false) private Date createdAt;
    @LastModifiedBy   private String updatedBy;
    @LastModifiedDate private Date updatedAt;

    /** Soft delete metadata */
    private String deletedBy;
    private Date deletedAt;

    // JSON-friendly helper methods
    public Boolean getDeleted() {
        return isDeleted != null && isDeleted == 1;
    }
    public void setDeleted(Boolean deleted) {
        this.isDeleted = (deleted != null && deleted) ? 1 : 0;
    }

    public Long getRegisteredKm() {
        return registeredKm != null ? registeredKm : totalKmDriven;
    }

    @PrePersist
    public void prePersist() {
        if (isDeleted == null) isDeleted = 0;
    }
}
