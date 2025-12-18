package com.example.Transport.entity;

import com.example.Transport.enums.FuelType;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
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
@Table(name = "fuel_logs", indexes = {
        @Index(name = "ix_fuel_logs_vehicle_month", columnList = "vehicle_id, month"),
        @Index(name = "ix_fuel_logs_date", columnList = "log_date")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    /** Snapshot fields for quick access and historical accuracy */
    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type")
    private FuelType fuelType;

    /** yyyy-MM */
    @Column(length = 7)
    private String month;

    @Temporal(TemporalType.DATE)
    @Column(name = "log_date")
    private Date logDate;

    private Long startOdo;
    private Long endOdo;
    private Long deltaKm;
    private Double litres;
    private Double pricePerL;
    private Double cost;
    private Double efficiencyUsed;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @CreatedDate
    @Column(updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @LastModifiedBy
    private String updatedBy;

    @LastModifiedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @JsonProperty("vehicleId")
    public Long getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }

    @PrePersist
    public void prePersist() {
        if (month == null && logDate != null) {
            month = new java.text.SimpleDateFormat("yyyy-MM").format(logDate);
        }
        if (fuelType == null) {
            fuelType = FuelType.PETROL;
        }
    }
}
