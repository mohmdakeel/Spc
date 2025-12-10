package com.example.Transport.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class VehicleAvailabilityDto {
    private Long vehicleId;
    private String vehicleNumber;
    private String vehicleType;
    private List<BusyWindowDto> busy;
}
