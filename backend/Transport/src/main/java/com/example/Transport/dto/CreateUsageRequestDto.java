package com.example.Transport.dto;

import com.example.Transport.dto.validation.ValidUsageRequest;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

@ValidUsageRequest
public class CreateUsageRequestDto {

  @NotBlank(message = "applicantName is required")
  @Size(max = 100)
  public String applicantName;

  @NotBlank(message = "employeeId is required")
  @Size(max = 50)
  public String employeeId;

  @NotBlank(message = "department is required")
  @Size(max = 100)
  public String department;

  /** NEW: when the request is applied. If null, service will default to today (UTC). */
  @PastOrPresent(message = "appliedDate cannot be in the future")
  public LocalDate appliedDate;

  @NotNull(message = "dateOfTravel is required")
  @FutureOrPresent(message = "dateOfTravel cannot be in the past")
  public LocalDate dateOfTravel;

  @NotBlank(message = "timeFrom is required")
  @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "timeFrom must be HH:mm")
  public String timeFrom; // "HH:mm"

  @NotBlank(message = "timeTo is required")
  @Pattern(regexp = "^\\d{2}:\\d{2}$", message = "timeTo must be HH:mm")
  public String timeTo;   // "HH:mm"

  @NotBlank(message = "fromLocation is required")
  @Size(max = 200)
  public String fromLocation;

  @NotBlank(message = "toLocation is required")
  @Size(max = 200)
  public String toLocation;

  @Size(max = 1000)
  public String officialDescription;

  @Size(max = 500)
  public String goods;

  /* ===== NEW: Travelling with an officer ===== */
  public Boolean travelWithOfficer;            // optional
  @Size(max = 100) public String officerName;  // required if travelWithOfficer == true (validated server-side)
  @Size(max = 50)  public String officerId;
  @Size(max = 20)  public String officerPhone;

  // Optional; typically you’ll read actor from header and auditing
  @Size(max = 100)
  public String actor;
}
