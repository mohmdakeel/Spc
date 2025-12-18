package com.example.Transport.history.dto;

import lombok.*;
import java.util.Date;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class HistoryRecordDto {
    private Long id;
    private String entityType;
    private String entityId;
    private String action;
    private String performedBy;
    private Date timestamp;
    private String previousJson; // for side-by-side UI if needed
    private String newJson;
}
