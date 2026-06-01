package vn.lms.library.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.lms.library.domain.entity.NotificationLogEntity;
import vn.lms.library.domain.enums.NotificationType;

import java.time.LocalDate;
import java.util.UUID;

public interface NotificationLogRepository extends JpaRepository<NotificationLogEntity, UUID> {
    boolean existsByLoanIdAndTypeAndSentOn(UUID loanId, NotificationType type, LocalDate sentOn);

    boolean existsByMemberIdAndTypeAndSentOn(UUID memberId, NotificationType type, LocalDate sentOn);

    Page<NotificationLogEntity> findByMemberIdOrderByCreatedAtDesc(UUID memberId, Pageable pageable);

    Page<NotificationLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
