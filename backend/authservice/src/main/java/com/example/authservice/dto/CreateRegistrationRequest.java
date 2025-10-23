// src/main/java/com/example/authservice/dto/CreateRegistrationRequest.java
package com.example.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class CreateRegistrationRequest {
  @NotBlank
  private String epfNo;

  private String attendanceNo;
  private String nameWithInitials;
  private String surname;
  private String fullName;
  @NotBlank
  private String nicNo;
  private LocalDate dateOfBirth;
  private String civilStatus;
  private String gender;
  private String race;
  private String religion;
  private String bloodGroup;
  private String permanentAddress;
  private String district;
  private String mobileNo;
  private String personalEmail;
  private String cardStatus;
  private String imageUrl;
  private String currentAddress;
  private String dsDivision;
  private String residencePhone;
  private String emergencyContact;
  private String workingStatus;
  private String department;
}