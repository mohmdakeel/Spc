package com.example.Transport.dto;


import java.time.LocalDateTime;

public class AssignRequestDto {
  public String actor;

  public Long vehicleId;
  public String vehicleNumber;

  public Long driverId;
  public String driverName;
  public String driverPhone;

  public LocalDateTime pickupAt;
  public LocalDateTime expectedReturnAt;

  public String instructions; // optional notes
}
