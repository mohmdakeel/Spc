package com.example.Transport.history.dto;

import lombok.*;
import java.util.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CompareResult {
    private String entityType;
    private String entityId;
    private String action;           // from history record we compared against
    private String comparedAgainst;  // "latest-previous" or "history-id:123"
    private String performedBy;
    private Date timestamp;
    private List<ChangeItem> changes;
}
