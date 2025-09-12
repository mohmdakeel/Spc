package com.example.Transport.history.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChangeItem {
    private String field;      // "phone", "status", "licenseExpiryDate"
    private Object beforeVal;  // before
    private Object afterVal;   // after
    private String changeType; // ADDED / REMOVED / CHANGED / ERROR
}
