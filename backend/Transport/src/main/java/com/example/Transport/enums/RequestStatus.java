package com.example.Transport.enums;

public enum RequestStatus {
    DRAFT,                // reserved
    PENDING_HOD,          // after submit
    REJECTED,             // hod or management rejected
    PENDING_MANAGEMENT,   // after HOD approve
    APPROVED,             // after Mgmt approve
    SCHEDULED,            // assigned by in-charge
    DISPATCHED,           // gate EXIT
    RETURNED              // gate ENTRY complete
}
