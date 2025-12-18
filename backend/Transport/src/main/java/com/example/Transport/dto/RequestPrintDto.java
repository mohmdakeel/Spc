package com.example.Transport.dto;

import com.example.Transport.enums.RequestStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RequestPrintDto {
  /* Header */
  private Long id;
  private String requestCode;
  private RequestStatus status;

  /* Applicant */
  private String applicantName;
  private String employeeId;
  private String department;

  /* Trip */
  private LocalDate dateOfTravel;
  private String timeFrom; // keep strings for clean printing
  private String timeTo;
  private boolean overnight;
  private String fromLocation;
  private String toLocation;
  private String officialDescription;
  private String goods;

  /* Assignment */
  private Long assignedVehicleId;
  private String assignedVehicleNumber;
  private Long assignedDriverId;
  private String assignedDriverName;
  private String assignedDriverPhone;
  private LocalDateTime scheduledPickupAt;
  private LocalDateTime scheduledReturnAt;

  /* Gate */
  private LocalDateTime gateExitAt;
  private LocalDateTime gateEntryAt;
  private Integer exitOdometer;
  private Integer entryOdometer;
}
