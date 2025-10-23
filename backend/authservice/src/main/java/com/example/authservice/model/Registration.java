// src/main/java/com/example/authservice/model/Registration.java
package com.example.authservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.Where;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "registration", indexes = @Index(name = "idx_registration_epf_no", columnList = "epf_no"))
@EntityListeners(AuditingEntityListener.class)
@Where(clause = "deleted=false")
public class Registration {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank @Column(name = "epf_no", nullable = false, unique = true, length = 64)
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
  private String department;

  @Builder.Default
  private boolean deleted = false;

  @CreatedDate private LocalDateTime addedTime;
  @CreatedBy  private String addedBy;
  @LastModifiedDate private LocalDateTime modifiedTime;
  @LastModifiedBy   private String modifiedBy;
  private LocalDateTime deletedTime;
  private String deletedBy;

  @Version private Long version;

  public void markAsDeleted(String actor){
    this.deleted = true;
    this.deletedTime = LocalDateTime.now();
    this.deletedBy = actor;
  }
}