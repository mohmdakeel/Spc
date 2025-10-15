package com.example.Transport.dto;

import com.example.Transport.enums.Department;
import com.example.Transport.enums.Urgency;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Date;
import java.util.List;

public class ServiceRequisiteDtos {

    @Data
    public static class HrApproveRequest {
        /** Optional, HR can skip */
        private List<String> extraServices;

        private Urgency urgency; // IMMEDIATE or NORMAL

        private Department approvalByDepartment; // WORK_MANAGER, MAINSTORES, NONE

        @JsonFormat(pattern = "yyyy-MM-dd")
        private Date requiredByDate;
    }

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class Response {
        private Long id;
        private Long driverServiceRequestId;
        private Date approvedDate;
        private String section;
        private String vehicleNumber;
        private String vehicleType;

        private List<String> servicesNeeded;
        private List<String> extraServices;

        private Urgency urgency;
        private Department approvalByDepartment;
        private String departmentApprovalStatus;
        private Date requiredByDate;

        private String createdBy;
        private Date createdAt;
        private String updatedBy;
        private Date updatedAt;
    }
}
