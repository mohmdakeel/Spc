package com.example.Transport.entity;

import com.example.Transport.enums.Department;
import com.example.Transport.enums.Urgency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "service_requisites",
        indexes = {
                @Index(name = "ix_sr_vehicle", columnList = "vehicle_number"),
                @Index(name = "ix_sr_required_by", columnList = "required_by_date")
        })
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequisite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Link back to the DSR that triggered this record */
    private Long driverServiceRequestId;

    /** When HR approved the DSR */
    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedDate;

    /** Fixed section as requested */
    @Builder.Default
    private String section = "Transport";

    /** Vehicle snapshot fields */
    private String vehicleNumber;
    private String vehicleType;

    /** Services from DSR; store as JSON using @ElementCollection for simplicity */
    @ElementCollection
    @CollectionTable(name = "service_requisite_services", joinColumns = @JoinColumn(name = "service_requisite_id"))
    @Column(name = "service_name")
    private List<String> servicesNeeded;

    /** HR may add more services at approval time or later */
    @ElementCollection
    @CollectionTable(name = "service_requisite_extra_services", joinColumns = @JoinColumn(name = "service_requisite_id"))
    @Column(name = "service_name")
    private List<String> extraServices;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Urgency urgency = Urgency.NORMAL;

    /** Optional: which department must approve later */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Department approvalByDepartment = Department.NONE;

    /** Their status (independent from HR’s APPROVED) */
    @Builder.Default
    private String departmentApprovalStatus = "PENDING"; // PENDING / APPROVED / DECLINED

    /** Deadline for completion */
    @Temporal(TemporalType.DATE)
    private Date requiredByDate;

    /** Audit */
    private String createdBy;
    @CreationTimestamp private Date createdAt;
    private String updatedBy;
    @UpdateTimestamp private Date updatedAt;
}
