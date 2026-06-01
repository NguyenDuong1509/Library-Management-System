package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.service.LibraryConfigSnapshot;
import vn.lms.library.domain.LoanPolicy;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.enums.CopyStatus;
import vn.lms.library.domain.enums.LoanStatus;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.LoanRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.ReservationRepository;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.web.BusinessException;

import java.time.Instant;
import java.util.UUID;

@Service
public class CirculationService {

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;
    private final BookCopyRepository copyRepository;
    private final ReservationRepository reservationRepository;
    private final MemberPolicy memberPolicy;
    private final FineService fineService;
    private final ReservationFulfillmentService fulfillmentService;
    private final LibraryConfigService configService;

    public CirculationService(
            LoanRepository loanRepository,
            MemberRepository memberRepository,
            BookCopyRepository copyRepository,
            ReservationRepository reservationRepository,
            MemberPolicy memberPolicy,
            FineService fineService,
            ReservationFulfillmentService fulfillmentService,
            LibraryConfigService configService) {
        this.loanRepository = loanRepository;
        this.memberRepository = memberRepository;
        this.copyRepository = copyRepository;
        this.reservationRepository = reservationRepository;
        this.memberPolicy = memberPolicy;
        this.fineService = fineService;
        this.fulfillmentService = fulfillmentService;
        this.configService = configService;
    }

    @Transactional
    public LoanEntity checkout(UUID memberId, UUID copyId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy độc giả."));
        memberPolicy.assertCanBorrow(member);

        LibraryConfigSnapshot config = configService.getSnapshot();
        long active = loanRepository.countByMemberIdAndStatus(memberId, LoanStatus.ACTIVE);
        if (!LoanPolicy.canCheckout((int) active, config.toLoanPolicyConfig())) {
            throw new BusinessException("Độc giả đã đạt giới hạn số sách mượn.");
        }

        BookCopyEntity copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bản sao."));
        if (copy.getStatus() != CopyStatus.AVAILABLE) {
            throw new BusinessException("Bản sao không khả dụng để mượn.");
        }

        Instant now = Instant.now();
        LoanEntity loan = new LoanEntity();
        loan.setMember(member);
        loan.setBookCopy(copy);
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setCheckoutAt(now);
        loan.setDueAt(LoanPolicy.computeDueDate(now, config.loanDaysDefault()));
        loan.setRenewalCount(0);
        LoanEntity saved = loanRepository.save(loan);

        copy.setStatus(CopyStatus.ON_LOAN);
        copyRepository.save(copy);
        return saved;
    }

    @Transactional
    public LoanEntity returnLoan(UUID loanId) {
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy phiếu mượn."));
        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BusinessException("Phiếu mượn không còn hoạt động.");
        }

        Instant now = Instant.now();
        loan.setStatus(LoanStatus.RETURNED);
        loan.setReturnedAt(now);
        loanRepository.save(loan);

        BookCopyEntity copy = loan.getBookCopy();
        copy.setStatus(CopyStatus.AVAILABLE);
        copyRepository.save(copy);

        fineService.createOverdueFineIfNeeded(loan, now);
        fulfillmentService.onCopyReturned(copy.getBook().getId());
        return loan;
    }

    @Transactional
    public LoanEntity renew(UUID loanId) {
        LoanEntity loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy phiếu mượn."));
        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BusinessException("Chỉ gia hạn phiếu mượn đang hoạt động.");
        }

        UUID bookId = loan.getBookCopy().getBook().getId();
        boolean blocking = reservationRepository.countByBookIdAndStatus(bookId, ReservationStatus.PENDING) > 0;

        LibraryConfigSnapshot config = configService.getSnapshot();
        LoanPolicy.Result result = LoanPolicy.canRenew(
                loan.getRenewalCount(), blocking, config.toLoanPolicyConfig());
        if (!result.allowed()) {
            throw new BusinessException(switch (result.error()) {
                case RENEWAL_LIMIT_REACHED -> "Đã hết lượt gia hạn.";
                case RESERVATION_BLOCKS_RENEWAL -> "Có đặt trước, không thể gia hạn.";
                default -> "Không thể gia hạn.";
            });
        }

        loan.setDueAt(LoanPolicy.extendDueDate(loan.getDueAt(), config.loanDaysDefault()));
        loan.setRenewalCount(loan.getRenewalCount() + 1);
        return loanRepository.save(loan);
    }

    @Transactional(readOnly = true)
    public LoanEntity findLoan(UUID loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy phiếu mượn."));
    }
}
