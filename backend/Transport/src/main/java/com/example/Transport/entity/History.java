package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class History {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityType;

    @Column(nullable = false)
    private String entityId;

    @Column(nullable = false)
    private String action; // "Created", "Updated", "Deleted"

    @Column(nullable = false)
    private String performedBy;

    @Column(nullable = false)
    private Date timestamp;

    @Column(columnDefinition = "TEXT")
    private String previousData; // JSON of previous data (used for updates and deletes)

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = new Date();
        }
    }
}
