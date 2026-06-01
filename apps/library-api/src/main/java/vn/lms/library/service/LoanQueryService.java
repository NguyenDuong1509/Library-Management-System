package vn.lms.library.service;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class LoanQueryService {

    private final LoanRepository loanRepository;

    public LoanQueryService(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    public List<ActiveLoanResult> listActiveByMember(UUID memberId) {
        return loanRepository.findByMemberIdAndStatusOrderByDueAtAsc(memberId, LoanStatus.ACTIVE).stream()
                .map(this::toActiveLoan)
                .toList();
    }

    public PageResponse<HistoryLoanResult> listHistoryByMember(UUID memberId, PageRequest page) {
        Page<LoanEntity> result = loanRepository.findByMemberIdAndStatusOrderByReturnedAtDesc(
                memberId,
                LoanStatus.RETURNED,
                org.springframework.data.domain.PageRequest.of(page.page(), page.size()));
        return PageResponse.from(result, this::toHistoryLoan);
    }

    private ActiveLoanResult toActiveLoan(LoanEntity loan) {
        return new ActiveLoanResult(
                loan.getId(),
                loan.getBookCopy().getCopyCode(),
                loan.getBookCopy().getBook().getTitle(),
                loan.getDueAt(),
                loan.getRenewalCount());
    }

    private HistoryLoanResult toHistoryLoan(LoanEntity loan) {
        return new HistoryLoanResult(
                loan.getId(),
                loan.getBookCopy().getCopyCode(),
                loan.getBookCopy().getBook().getTitle(),
                loan.getCheckoutAt(),
                loan.getDueAt(),
                loan.getReturnedAt(),
                loan.getRenewalCount());
    }

    public record ActiveLoanResult(
            UUID loanId, String copyCode, String bookTitle, Instant dueAt, int renewalCount) {
    }

    public record HistoryLoanResult(
            UUID loanId,
            String copyCode,
            String bookTitle,
            Instant checkoutAt,
            Instant dueAt,
            Instant returnedAt,
            int renewalCount) {
    }
}
