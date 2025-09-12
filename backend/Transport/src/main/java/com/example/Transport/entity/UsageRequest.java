package com.example.Transport.entity;

import com.example.Transport.enums.RequestStatus;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(
    name = "usage_requests",
    indexes = {
        @Index(name = "idx_req_status", columnList = "status"),
        @Index(name = "idx_req_vehicle_time", columnList = "assignedVehicleId,scheduledPickupAt,scheduledReturnAt,status"),
        @Index(name = "idx_req_driver_time", columnList = "assignedDriverId,scheduledPickupAt,scheduledReturnAt,status"),
        @Index(name = "idx_req_employee", columnList = "employeeId,createdAt"),
        @Index(name = "idx_req_department", columnList = "department,createdAt")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false, length = 32)
  private String requestCode;

  // Department submission
  private String applicantName;
  private String employeeId;
  private String department;

  /** NEW: when the request was applied */
  private LocalDate appliedDate;

  private LocalDate dateOfTravel;
  private LocalTime timeFrom;
  private LocalTime timeTo;
  private boolean overnight;

  private String fromLocation;
  private String toLocation;

  @Column(length = 1000)
  private String officialDescription;

  @Column(length = 1000)
  private String goods;

  /* ===== NEW: Travelling with an officer ===== */
  private boolean travelWithOfficer;
  @Column(length = 100)
  private String officerName;
  @Column(length = 50)
  private String officerId;
  @Column(length = 20)
  private String officerPhone;

  /** Default workflow status when creating a request */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  @Builder.Default
  private RequestStatus status = RequestStatus.PENDING_HOD;

  // Scheduling
  private Long assignedVehicleId;
  private String assignedVehicleNumber;

  private Long assignedDriverId;
  private String assignedDriverName;
  private String assignedDriverPhone;

  private LocalDateTime scheduledPickupAt;
  private LocalDateTime scheduledReturnAt;

  // Gate logs
  private LocalDateTime gateExitAt;
  private LocalDateTime gateEntryAt;

  private Integer exitOdometer;
  private Integer entryOdometer;

  @Lob
  @Column(columnDefinition = "LONGTEXT")
  private String exitManifestJson;

  @Lob
  @Column(columnDefinition = "LONGTEXT")
  private String entryManifestJson;

  // Audit
  @CreatedBy
  private String createdBy;

  @CreatedDate
  private LocalDateTime createdAt;

  @LastModifiedBy
  private String updatedBy;

  @LastModifiedDate
  private LocalDateTime updatedAt;
}
