package vn.lms.library.job;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.service.LibraryConfigService;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.entity.NotificationLogEntity;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.domain.enums.NotificationType;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.repository.NotificationLogRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class NotificationJob {

    private final LoanRepository loanRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final LibraryConfigService configService;

    public NotificationJob(
            LoanRepository loanRepository,
            NotificationLogRepository notificationLogRepository,
            LibraryConfigService configService) {
        this.loanRepository = loanRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.configService = configService;
    }

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendReminders() {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now();
        List<LoanEntity> active = loanRepository.findByStatus(LoanStatus.ACTIVE);

        for (LoanEntity loan : active) {
            long daysUntilDue = ChronoUnit.DAYS.between(today, loan.getDueAt().atZone(java.time.ZoneOffset.UTC).toLocalDate());
            if (daysUntilDue >= 0 && daysUntilDue <= configService.getSnapshot().reminderDaysBefore()) {
                logOnce(loan, NotificationType.DUE_SOON, today);
            }
            if (loan.getDueAt().isBefore(now)) {
                logOnce(loan, NotificationType.OVERDUE, today);
            }
        }
    }

    private void logOnce(LoanEntity loan, NotificationType type, LocalDate sentOn) {
        if (notificationLogRepository.existsByLoanIdAndTypeAndSentOn(loan.getId(), type, sentOn)) {
            return;
        }
        NotificationLogEntity log = new NotificationLogEntity();
        log.setLoanId(loan.getId());
        log.setMemberId(loan.getMember().getId());
        log.setType(type);
        log.setSentOn(sentOn);
        notificationLogRepository.save(log);
    }
}
