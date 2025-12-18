package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "change_history", indexes = {
        @Index(name = "idx_hist_type_id_time", columnList = "entityType,entityId,timestamp")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChangeHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType;   // "Driver" or "Vehicle"
    private String entityId;     // primary key string (employeeId or vehicle id)

    private String action;       // "Created", "Updated", "Deleted"
    private String performedBy;  // actor

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    @Lob @Column(columnDefinition = "LONGTEXT")
    private String previousData; // JSON (before)

    @Lob @Column(columnDefinition = "LONGTEXT")
    private String newData;      // JSON (after)
}
