package com.example.Transport.enums;

public enum ApprovalStage {
    HOD,            // Department Head
    MANAGEMENT,     // HRD / GM / Chairman (any one can approve)
    ASSIGNMENT,     // Vehicle in-charge
    GATE,           // Gate Security (dispatch/return)
    NONE            // terminal
}
