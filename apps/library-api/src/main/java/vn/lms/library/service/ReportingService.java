package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.enums.FineStatus;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.repository.FineRepository;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.repository.ReservationRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportingService {

    private final LoanRepository loanRepository;
    private final FineRepository fineRepository;
    private final ReservationRepository reservationRepository;

    public ReportingService(
            LoanRepository loanRepository,
            FineRepository fineRepository,
            ReservationRepository reservationRepository) {
        this.loanRepository = loanRepository;
        this.fineRepository = fineRepository;
        this.reservationRepository = reservationRepository;
    }

    public List<OverdueLoan> overdueLoans(Instant from, Instant to) {
        Instant now = Instant.now();
        return loanRepository.findByStatusAndDueAtBefore(LoanStatus.ACTIVE, now).stream()
                .filter(loan -> withinRange(loan.getDueAt(), from, to))
                .map(loan -> new OverdueLoan(
                        loan.getId(),
                        loan.getMember().getLibraryCardId(),
                        loan.getBookCopy().getCopyCode(),
                        loan.getDueAt()))
                .toList();
    }

    public List<OverdueLoan> overdueLoans() {
        return overdueLoans(null, null);
    }

    public List<TopBook> topBorrowed(int limit, Instant from, Instant to) {
        Map<UUID, Long> counts = loanRepository.findAll().stream()
                .filter(loan -> withinRange(loan.getCheckoutAt(), from, to))
                .collect(Collectors.groupingBy(
                        loan -> loan.getBookCopy().getBook().getId(),
                        Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Map.Entry.<UUID, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(limit)
                .map(e -> {
                    LoanEntity sample = loanRepository.findAll().stream()
                            .filter(l -> l.getBookCopy().getBook().getId().equals(e.getKey()))
                            .findFirst()
                            .orElseThrow();
                    return new TopBook(
                            e.getKey(),
                            sample.getBookCopy().getBook().getTitle(),
                            e.getValue().intValue());
                })
                .toList();
    }

    public List<TopBook> topBorrowed(int limit) {
        return topBorrowed(limit, null, null);
    }

    public FineSummary fineSummary(Instant from, Instant to) {
        int unpaid = fineRepository.findByStatus(FineStatus.UNPAID).stream()
                .filter(f -> withinRange(f.getCreatedAt(), from, to))
                .mapToInt(f -> f.getAmount())
                .sum();
        int paid = fineRepository.findByStatus(FineStatus.PAID).stream()
                .filter(f -> withinRange(f.getCreatedAt(), from, to))
                .mapToInt(f -> f.getAmount())
                .sum();
        return new FineSummary(unpaid, paid, unpaid + paid);
    }

    public FineSummary fineSummary() {
        return fineSummary(null, null);
    }

    public String exportOverdueCsv(Instant from, Instant to) {
        StringBuilder sb = new StringBuilder("loanId,libraryCardId,copyCode,dueAt\n");
        overdueLoans(from, to).forEach(row ->
                sb.append(row.loanId()).append(',')
                        .append(csvEscape(row.libraryCardId())).append(',')
                        .append(csvEscape(row.copyCode())).append(',')
                        .append(row.dueAt()).append('\n'));
        return sb.toString();
    }

    public String exportTopBooksCsv(int limit, Instant from, Instant to) {
        StringBuilder sb = new StringBuilder("bookId,title,loanCount\n");
        topBorrowed(limit, from, to).forEach(row ->
                sb.append(row.bookId()).append(',')
                        .append(csvEscape(row.title())).append(',')
                        .append(row.loanCount()).append('\n'));
        return sb.toString();
    }

    public String exportFinesCsv(Instant from, Instant to) {
        FineSummary summary = fineSummary(from, to);
        return "unpaidTotal,paidTotal,grandTotal\n"
                + summary.unpaidTotal() + ','
                + summary.paidTotal() + ','
                + summary.grandTotal() + '\n';
    }

    private boolean withinRange(Instant value, Instant from, Instant to) {
        if (from != null && value.isBefore(from)) {
            return false;
        }
        return to == null || !value.isAfter(to);
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    public DashboardKpis dashboardKpis() {
        Instant startOfDay = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        long checkoutsToday = loanRepository.countByCheckoutAtGreaterThanEqual(startOfDay);
        long pendingReservations = reservationRepository.countByStatusIn(
                List.of(ReservationStatus.PENDING, ReservationStatus.READY));
        int overdueCount = overdueLoans().size();
        int unpaidFineTotal = fineSummary().unpaidTotal();
        return new DashboardKpis(checkoutsToday, pendingReservations, overdueCount, unpaidFineTotal);
    }

    public record DashboardKpis(
            long checkoutsToday,
            long pendingReservations,
            int overdueCount,
            int unpaidFineTotal) {
    }

    public record OverdueLoan(UUID loanId, String libraryCardId, String copyCode, Instant dueAt) {
    }

    public record TopBook(UUID bookId, String title, int loanCount) {
    }

    public record FineSummary(int unpaidTotal, int paidTotal, int grandTotal) {
    }
}
