package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.NotificationLogEntity;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.domain.enums.NotificationType;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.repository.NotificationLogRepository;
import vn.lms.library.repository.ReservationRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReservationFulfillmentService {

    private final ReservationRepository reservationRepository;
    private final NotificationLogRepository notificationLogRepository;

    public ReservationFulfillmentService(
            ReservationRepository reservationRepository,
            NotificationLogRepository notificationLogRepository) {
        this.reservationRepository = reservationRepository;
        this.notificationLogRepository = notificationLogRepository;
    }

    @Transactional
    public void onCopyReturned(UUID bookId) {
        Optional<ReservationEntity> next = reservationRepository
                .findFirstByBookIdAndStatusOrderByQueuePositionAsc(bookId, ReservationStatus.PENDING);
        if (next.isEmpty()) {
            return;
        }
        ReservationEntity reservation = next.get();
        reservation.setStatus(ReservationStatus.READY);
        reservationRepository.save(reservation);

        UUID memberId = reservation.getMember().getId();
        LocalDate today = LocalDate.now();
        if (!notificationLogRepository.existsByMemberIdAndTypeAndSentOn(
                memberId, NotificationType.RESERVATION_READY, today)) {
            NotificationLogEntity log = new NotificationLogEntity();
            log.setMemberId(memberId);
            log.setType(NotificationType.RESERVATION_READY);
            log.setSentOn(today);
            notificationLogRepository.save(log);
        }
    }
}
