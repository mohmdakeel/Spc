package com.example.Transport.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@Entity
@Table(name = "vehicle_images",
       indexes = @Index(name="ix_vehicle_images_vehicle", columnList = "vehicle_id"))
@EntityListeners(AuditingEntityListener.class)
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VehicleImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Vehicle vehicle;

    /** storage key to delete later; for Cloudinary it's "cloudinary:<public_id>" */
    @Column(nullable = false, length = 512)
    private String storageKey;

    /** CDN-optimized HTTPS URL from Cloudinary */
    @Column(nullable = false, length = 1024)
    private String url;

    /** 0 = cover image */
    private Integer sortOrder = 0;

    @CreatedDate @Column(updatable = false)
    private Date createdAt;
}
