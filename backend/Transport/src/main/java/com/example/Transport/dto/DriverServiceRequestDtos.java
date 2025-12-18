package com.example.Transport.dto;

import com.example.Transport.enums.HrApprovalStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public class DriverServiceRequestDtos {

    @Data
    public static class CreateRequest {
        /** You can accept vehicleId or vehicleNumber; here we require vehicleNumber */
        @NotBlank private String vehicleNumber;

        @NotBlank private String epf;
        private String driverName;

        @JsonFormat(pattern = "yyyy-MM-dd")
        @NotNull private LocalDate requestDate;

        private List<String> servicesNeeded;

        private Long lastServiceReadingKm;
        private Long nextServiceReadingKm;
        private Long currentReadingKm;

        private String adviceByVehicleOfficer;
        private String adviceByMechanic;
    }

    @Data
    public static class UpdateRequest {
        private List<String> servicesNeeded;
        private Long lastServiceReadingKm;
        private Long nextServiceReadingKm;
        private Long currentReadingKm;
        private String adviceByVehicleOfficer;
        private String adviceByMechanic;
        private HrApprovalStatus hrApproval; // allow HR to set APPROVED/REJECTED
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private Long id;
        private Long vehicleId;
        private String vehicleNumber;
        private String driverName;
        private String epf;

        @JsonFormat(pattern = "yyyy-MM-dd")
        @NotNull private LocalDate requestDate;

        private List<String> servicesNeeded;
        private Long lastServiceReadingKm;
        private Long nextServiceReadingKm;
        private Long currentReadingKm;
        private String adviceByVehicleOfficer;
        private String adviceByMechanic;
        private HrApprovalStatus hrApproval;

        private Date createdAt;
        private Date updatedAt;
    }
}
