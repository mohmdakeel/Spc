package com.example.Transport.dto;

import com.example.Transport.enums.RequestStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GateLogRow {
  private Long id;
  private String requestCode;
  private String department;

  private String assignedVehicleNumber;
  private String assignedDriverName;
  private String destination; // toLocation

  private Integer exitOdometer;
  private Integer entryOdometer;

  private LocalDateTime scheduledPickupAt;
  private LocalDateTime scheduledReturnAt;

  private LocalDateTime gateExitAt;
  private LocalDateTime gateEntryAt;

  private RequestStatus status; // SCHEDULED/DISPATCHED/RETURNED
}
