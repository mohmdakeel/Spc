package com.example.Transport.entity;

import com.example.Transport.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Date;

@Entity
@Table(name = "vehicle_usage_requests",
       indexes = {
         @Index(name="idx_usage_status", columnList="status"),
         @Index(name="idx_usage_dateoftravel", columnList="dateOfTravel"),
         @Index(name="idx_usage_trip", columnList="tripId")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleUsageRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Applicant & Dept
    private String requestCode; // e.g., VR-2025-0001
    private String applicantName;
    private String employeeId;
    private String department;

    private String travelOfficerName;

    // Trip basics
    private LocalDate dateOfTravel;
    private LocalTime timeFrom;
    private LocalTime timeTo;
    private String fromLocation;
    private String toLocation;
    @Lob
    private String officialDescription;
    private String goods;

    // OPTIONAL: small-load hints (for pooling capacity)
    private Integer itemsCount;         // optional
    private Double goodsWeightKg;       // optional

    // Status
    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    // Approvals
    private String hodBy;          private Date hodAt;          private String hodRemarks;
    private String managementBy;   private Date managementAt;   private String managementRemarks;

    // Assignment (denormalized for quick views)
    private Long assignedVehicleId;   private String assignedVehicleNumber;
    private Long assignedDriverId;    private String assignedDriverName; private String assignedDriverPhone;
    private Date scheduledPickupAt;   private Date scheduledReturnAt;
    private String specialInstructions;

    // Gate times mirrored from Trip
    private Date gateExitAt;
    private Date gateEntryAt;

    // Odometers & computed usage (mirrored from Trip for convenience)
    private Long exitOdometerKm;   private Long entryOdometerKm;
    private Long kmTraveled;       private Double hoursUsed;

    // Pooled trip link
    private Long tripId;

    @CreationTimestamp
    private Date createdAt;
    private String createdBy;

    @UpdateTimestamp
    private Date updatedAt;
    private String updatedBy;

    private String deletedBy;
    private Date deletedAt;
}
