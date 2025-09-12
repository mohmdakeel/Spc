package com.example.Transport.util;

import com.example.Transport.entity.ChangeHistory;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class HistoryRecorder {
    private final ChangeHistoryRepository repo;
    private final ObjectMapper om;

    public void record(String entityType, String entityId, String action, Object before, Object after, String by) {
        try {
            String prev = before == null ? null : om.writeValueAsString(before);
            String next = after  == null ? null : om.writeValueAsString(after);
            repo.save(ChangeHistory.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .performedBy(by == null ? "system" : by)
                    .timestamp(new Date())
                    .previousData(prev)
                    .newData(next)
                    .build());
        } catch (Exception ignored) {}
    }
}
