package vn.lms.library.service;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.NotificationLogEntity;
import vn.lms.library.repository.NotificationLogRepository;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationLogRepository notificationLogRepository;

    public NotificationService(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    public PageResponse<NotificationView> listForMember(UUID memberId, PageRequest page) {
        Page<NotificationLogEntity> result = notificationLogRepository.findByMemberIdOrderByCreatedAtDesc(
                memberId,
                org.springframework.data.domain.PageRequest.of(page.page(), page.size()));
        return PageResponse.from(result, NotificationView::from);
    }

    public PageResponse<NotificationView> listAll(PageRequest page) {
        Page<NotificationLogEntity> result = notificationLogRepository.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(page.page(), page.size()));
        return PageResponse.from(result, NotificationView::from);
    }

    public record NotificationView(
            UUID id,
            UUID memberId,
            UUID loanId,
            String type,
            java.time.LocalDate sentOn,
            java.time.Instant createdAt) {
        static NotificationView from(NotificationLogEntity e) {
            return new NotificationView(
                    e.getId(),
                    e.getMemberId(),
                    e.getLoanId(),
                    e.getType().name(),
                    e.getSentOn(),
                    e.getCreatedAt());
        }
    }
}
