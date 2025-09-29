package com.example.Transport.entity;

import com.example.Transport.enums.ServiceCandidateSource;
import com.example.Transport.enums.ServiceCandidateStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "service_candidates",
        uniqueConstraints = @UniqueConstraint(name = "uk_sc_vehicle_active",
                columnNames = {"vehicle_id", "status"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceCandidate {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceCandidateSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ServiceCandidateStatus status = ServiceCandidateStatus.ACTIVE;

    /** short reason, e.g., "5000km interval", "Driver SR #123" */
    private String reason;

    @Lob
    private String notes;

    private String createdBy;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Date createdAt = new Date();

    private String updatedBy;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = new Date();
    }
}
