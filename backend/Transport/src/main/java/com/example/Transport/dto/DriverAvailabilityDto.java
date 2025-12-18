package com.example.Transport.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DriverAvailabilityDto {
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private List<BusyWindowDto> busy;
}
