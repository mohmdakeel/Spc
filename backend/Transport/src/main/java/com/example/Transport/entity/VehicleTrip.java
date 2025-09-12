package com.example.Transport.entity;

import com.example.Transport.enums.TripStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;

@Entity
@Table(name = "vehicle_trips",
       indexes = {
         @Index(name="idx_trip_status", columnList="status"),
         @Index(name="idx_trip_pickup", columnList="pickupAt"),
         @Index(name="idx_trip_vehicle", columnList="vehicleId")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTrip {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tripCode; // TR-2025-0001

    @Enumerated(EnumType.STRING)
    private TripStatus status;

    // Assignment
    private Long vehicleId;           private String vehicleNumber;
    private Long driverId;            private String driverName;     private String driverPhone;

    // Schedule
    private Date pickupAt;            private Date expectedReturnAt;

    // Actual gate times
    private Date gateExitAt;          private Date gateEntryAt;

    // Odo & usage
    private Long exitOdometerKm;      private Long entryOdometerKm;
    private Long kmTraveled;          private Double hoursUsed;

    private String instructions;

    // Audit
    @CreationTimestamp
    private Date createdAt;
    private String createdBy;

    @UpdateTimestamp
    private Date updatedAt;
    private String updatedBy;
}
