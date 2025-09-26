package com.example.Authservice1.audit;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name="audit_log", indexes={
    @Index(name="idx_audit_entity", columnList="entityName, entityId"),
    @Index(name="idx_audit_actor", columnList="actor")
})
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actor;
    private String action;
    private String entityName;
    private String entityId;

    @Column(columnDefinition="TEXT")
    private String detailsJson;

    @CreatedDate
    private LocalDateTime createdAt;
}
