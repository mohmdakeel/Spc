package com.example.Transport.dto;

import com.example.Transport.enums.RequestStatus;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MetricsDto {
  public long total;
  public Map<RequestStatus, Long> byStatus;
  public List<SimpleRequestRow> nextDayTop10;

  @Data @NoArgsConstructor @AllArgsConstructor @Builder
  public static class SimpleRequestRow {
    public Long id;
    public String requestCode;
    public String assignedVehicleNumber;
    public String assignedDriverName;
    public String scheduledPickupAt; // ISO string
  }
}
