package com.example.Transport.dto;

import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import lombok.*;

import jakarta.validation.constraints.NotNull;

public class ServiceCandidateDtos {

    @Data
    public static class CreateRequest {
        @NotNull private Long vehicleId;
        private String reason;
        private String notes;
        /** Optional. If null, controller method decides DRIVER/HR. */
        private ServiceCandidateSource source;
    }

    @Data @AllArgsConstructor @NoArgsConstructor @Builder
    public static class Response {
        private Long id;
        private Long vehicleId;
        private String vehicleNumber;
        private ServiceCandidateSource source;
        private ServiceCandidateStatus status;
        private String reason;
        private String notes;
        private String createdBy;
        private java.util.Date createdAt;
        private String updatedBy;
        private java.util.Date updatedAt;
    }

    @Data
    public static class UpdateStatusRequest {
        @NotNull private ServiceCandidateStatus status; // IN_PROGRESS or CLOSED
        private String notes;
    }
}
