package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "registration")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String epfNo;
    private String attendanceNo;
    private String nameWithInitials;
    private String surname;
    private String fullName;
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

}
