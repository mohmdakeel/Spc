package com.example.authservice.service;

import com.example.authservice.model.AuditLog;
import com.example.authservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditService {

    private final AuditLogRepository repo;

    // -----------------------------------------------------------------
    // LOG ACTION
    // -----------------------------------------------------------------
    @Transactional
    public void log(String actor, String action, String entityType, String entityId, String details) {
        repo.save(AuditLog.builder()
                .actor(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .atTime(LocalDateTime.now())
                .build());
    }

    // -----------------------------------------------------------------
    // SEARCH AUDIT LOGS (with filters)
    // -----------------------------------------------------------------
    public List<AuditLog> search(String username, String action, String fromDate, String toDate) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (username != null && !username.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("actor")), username.toLowerCase()));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("action")), action.toLowerCase()));
            }
            if (fromDate != null && !fromDate.isBlank()) {
                try {
                    LocalDateTime from = LocalDateTime.parse(fromDate);
                    predicates.add(cb.greaterThanOrEqualTo(root.get("atTime"), from));
                } catch (Exception ignored) {}
            }
            if (toDate != null && !toDate.isBlank()) {
                try {
                    LocalDateTime to = LocalDateTime.parse(toDate);
                    predicates.add(cb.lessThanOrEqualTo(root.get("atTime"), to));
                } catch (Exception ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return repo.findAll(spec)
                .stream()
                .sorted((a, b) -> b.getAtTime().compareTo(a.getAtTime()))
                .toList();
    }

    // -----------------------------------------------------------------
    // CONVENIENCE: MY HISTORY (current user)
    // -----------------------------------------------------------------
    public List<AuditLog> myHistory(String currentUsername) {
        return search(currentUsername, null, null, null);
    }

    // -----------------------------------------------------------------
    // CONVENIENCE: ALL HISTORY
    // -----------------------------------------------------------------
    public List<AuditLog> allHistory() {
        return search(null, null, null, null);
    }
}