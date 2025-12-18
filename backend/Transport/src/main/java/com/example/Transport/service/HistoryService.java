package com.example.Transport.service;

import com.example.Transport.entity.ChangeHistory;
import com.example.Transport.history.JsonDiff;
import com.example.Transport.history.dto.*;
import com.example.Transport.repository.ChangeHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final ChangeHistoryRepository historyRepository;
    private final ObjectMapper objectMapper; // use the configured mapper (UTC, etc.)

    public List<HistoryRecordDto> recent(int size) {
        var pageable = PageRequest.of(0, Math.max(1, size), Sort.by(Sort.Direction.DESC, "timestamp"));
        return historyRepository.findAll(pageable).getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<HistoryRecordDto> timeline(String entityType, String entityId) {
        return historyRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CompareResult compareHistoryRecord(Long historyId) {
        ChangeHistory h = historyRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("History not found: " + historyId));
        var changes = JsonDiff.diff(objectMapper, h.getPreviousData(), h.getNewData());
        return CompareResult.builder()
                .entityType(h.getEntityType())
                .entityId(h.getEntityId())
                .action(h.getAction())
                .comparedAgainst("history-id:" + historyId)
                .performedBy(h.getPerformedBy())
                .timestamp(h.getTimestamp())
                .changes(changes)
                .build();
    }

    private HistoryRecordDto toDto(ChangeHistory h) {
        return HistoryRecordDto.builder()
                .id(h.getId())
                .entityType(h.getEntityType())
                .entityId(h.getEntityId())
                .action(h.getAction())
                .performedBy(h.getPerformedBy())
                .timestamp(h.getTimestamp())
                .previousJson(h.getPreviousData())
                .newJson(h.getNewData())
                .build();
    }
}
