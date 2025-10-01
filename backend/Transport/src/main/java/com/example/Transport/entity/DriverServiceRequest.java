package com.example.Transport.entity;

import com.example.Transport.enums.HrApprovalStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "driver_service_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DriverServiceRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Link to vehicle (preferred FK); you can also store vehicleNumber for audit */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;

    private String driverName;

    /** EPF (employee number) */
    @Column(name = "epf", nullable = false)
    private String epf;



    @Column(name = "request_date")
    private LocalDate requestDate;
    /** simple list of requested services; could be normalized later */
    @ElementCollection
    @CollectionTable(name = "driver_service_request_items",
            joinColumns = @JoinColumn(name = "request_id"))
    @Column(name = "service_item")
    private List<String> servicesNeeded;

    /** readings (km) */
    private Long lastServiceReadingKm;
    private Long nextServiceReadingKm;
    private Long currentReadingKm;

    /** optional advice fields */
    @Column(length = 1000) private String adviceByVehicleOfficer;
    @Column(length = 1000) private String adviceByMechanic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HrApprovalStatus hrApproval = HrApprovalStatus.PENDING;

    /** audit (simplified) */
    private String createdBy;
    @Temporal(TemporalType.TIMESTAMP) @Column(nullable = false, updatable = false)
    @Builder.Default private Date createdAt = new Date();
    private String updatedBy;
    @Temporal(TemporalType.TIMESTAMP) private Date updatedAt;

    @PreUpdate
    public void onUpdate() { this.updatedAt = new Date(); }
}
