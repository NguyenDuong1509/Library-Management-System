package vn.lms.library.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.AuditLogEntity;
import vn.lms.library.repository.AuditLogRepository;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(UUID actorUserId, String action, String targetType, String targetId, String detail) {
        AuditLogEntity entry = new AuditLogEntity();
        entry.setActorUserId(actorUserId);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setDetail(detail);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public AuditPage list(int page, int size) {
        var result = auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return new AuditPage(
                result.getContent().stream().map(AuditEntry::from).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize());
    }

    public record AuditEntry(
            UUID id,
            UUID actorUserId,
            String action,
            String targetType,
            String targetId,
            String detail,
            java.time.Instant createdAt) {
        static AuditEntry from(AuditLogEntity e) {
            return new AuditEntry(
                    e.getId(),
                    e.getActorUserId(),
                    e.getAction(),
                    e.getTargetType(),
                    e.getTargetId(),
                    e.getDetail(),
                    e.getCreatedAt());
        }
    }

    public record AuditPage(
            java.util.List<AuditEntry> content,
            long totalElements,
            int totalPages,
            int page,
            int size) {
    }
}
