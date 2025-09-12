package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "vehicle_assignments", indexes = {
        @Index(name = "idx_assign_request", columnList = "requestId")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehicleAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long requestId; // FK to VehicleUsageRequest.id

    // snapshot of assigned info
    private Long vehicleId;          private String vehicleNumber;
    private Long driverId;           private String driverName;   private String driverPhone;
    private Date pickupAt;           private Date expectedReturnAt;
    private String instructions;

    private String assignedBy;       private Date assignedAt;
}
