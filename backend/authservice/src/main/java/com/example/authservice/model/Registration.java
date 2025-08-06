package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "registration")
@EntityListeners(AuditingEntityListener.class)
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

    private boolean deleted = false;

    @CreatedDate
    private LocalDateTime addedTime;

    @CreatedBy
    private String addedBy;

    @LastModifiedDate
    private LocalDateTime modifiedTime;

    @LastModifiedBy
    private String modifiedBy;

    private LocalDateTime deletedTime;
    private String deletedBy;

    @Version
    private Long version;

    public void markAsDeleted(String deletedBy) {
        this.deleted = true;
        this.deletedTime = LocalDateTime.now();
        this.deletedBy = deletedBy; // ✅ Fixed
    }

    public boolean isDeleted() {
        return deleted;
    }
}