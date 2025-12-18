package com.example.Transport.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BusyWindowDto {
    private LocalDateTime from;
    private LocalDateTime to;
    private String requestCode;
    private String vehicleNumber;
    private String driverName;
    private String status;
}
