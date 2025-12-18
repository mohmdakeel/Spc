package com.example.Transport.dto;

import com.example.Transport.enums.FuelType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateFuelLogDto {
    @NotNull
    private Long vehicleId;

    /** yyyy-MM (if omitted, derived from logDate or today) */
    private String month;

    private Long startOdo;
    private Long endOdo;
    private Long deltaKm;
    private Double litres;
    private Double pricePerL;
    private Double efficiencyUsed;
    private Double cost;
    private FuelType fuelType;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate logDate;
}
