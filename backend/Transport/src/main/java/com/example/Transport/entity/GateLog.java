package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "gate_logs", indexes = {
        @Index(name = "idx_gate_request", columnList = "requestId")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GateLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long requestId; // VehicleUsageRequest.id

    private Date exitAt;
    private String exitBy;

    private Date entryAt;
    private String entryBy;
}
