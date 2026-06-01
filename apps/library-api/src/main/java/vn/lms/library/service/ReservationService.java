package vn.lms.library.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.lms.library.domain.ReservationQueue;
import vn.lms.library.domain.entity.BookCopyEntity;
import vn.lms.library.domain.entity.BookEntity;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.entity.MemberEntity;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.domain.enums.MemberStatus;
import vn.lms.library.domain.enums.ReservationStatus;
import vn.lms.library.repository.BookCopyRepository;
import vn.lms.library.repository.BookRepository;
import vn.lms.library.repository.MemberRepository;
import vn.lms.library.repository.ReservationRepository;
import vn.lms.library.web.BusinessException;
import vn.lms.library.web.ConflictException;

import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {

    private static final EnumSet<ReservationStatus> OPEN_STATUSES =
            EnumSet.of(ReservationStatus.PENDING, ReservationStatus.READY);

    private static final EnumSet<ReservationStatus> CANCELLABLE_STATUSES =
            EnumSet.of(ReservationStatus.PENDING, ReservationStatus.READY);

    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository copyRepository;
    private final CirculationService circulationService;

    public ReservationService(
            ReservationRepository reservationRepository,
            MemberRepository memberRepository,
            BookRepository bookRepository,
            BookCopyRepository copyRepository,
            CirculationService circulationService) {
        this.reservationRepository = reservationRepository;
        this.memberRepository = memberRepository;
        this.bookRepository = bookRepository;
        this.copyRepository = copyRepository;
        this.circulationService = circulationService;
    }

    @Transactional(readOnly = true)
    public List<ReservationEntity> listByBook(UUID bookId) {
        return reservationRepository.findByBookIdAndStatusInOrderByQueuePositionAsc(
                bookId, EnumSet.of(ReservationStatus.PENDING, ReservationStatus.READY));
    }

    @Transactional(readOnly = true)
    public List<ReservationEntity> listOpen() {
        return reservationRepository.findOpenWithDetails(
                EnumSet.of(ReservationStatus.PENDING, ReservationStatus.READY));
    }

    @Transactional(readOnly = true)
    public List<ReservationEntity> listByMember(UUID memberId) {
        return reservationRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }

    @Transactional
    public ReservationEntity create(UUID memberId, UUID bookId) {
        assertNoDuplicate(memberId, bookId);
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy độc giả."));
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy sách."));

        int pending = (int) reservationRepository.countByBookIdAndStatus(bookId, ReservationStatus.PENDING);
        int position = ReservationQueue.nextQueuePosition(pending);

        ReservationEntity reservation = new ReservationEntity();
        reservation.setMember(member);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setQueuePosition(position);
        return reservationRepository.save(reservation);
    }

    @Transactional
    public ReservationEntity cancel(UUID reservationId, UUID actorMemberId, boolean isStaff) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đặt trước."));

        if (!isStaff && !reservation.getMember().getId().equals(actorMemberId)) {
            throw new BusinessException("Không có quyền hủy đặt trước này.");
        }
        if (!CANCELLABLE_STATUSES.contains(reservation.getStatus())) {
            throw new ConflictException("Không thể hủy đặt trước ở trạng thái hiện tại.");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationRepository.save(reservation);
    }

    @Transactional
    public FulfillResult fulfill(UUID reservationId, UUID copyId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đặt trước."));
        if (reservation.getStatus() != ReservationStatus.READY) {
            throw new ConflictException("Chỉ có thể nhận sách khi đặt trước ở trạng thái READY.");
        }

        MemberEntity member = reservation.getMember();
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new BusinessException("Độc giả không ở trạng thái ACTIVE.");
        }

        BookCopyEntity copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy bản sao."));
        if (!copy.getBook().getId().equals(reservation.getBook().getId())) {
            throw new BusinessException("Bản sao không thuộc đầu sách đặt trước.");
        }

        LoanEntity loan = circulationService.checkout(member.getId(), copyId);
        reservation.setStatus(ReservationStatus.FULFILLED);
        reservationRepository.save(reservation);
        return new FulfillResult(reservation, loan);
    }

    public record FulfillResult(ReservationEntity reservation, LoanEntity loan) {
    }

    private void assertNoDuplicate(UUID memberId, UUID bookId) {
        if (reservationRepository.existsByMemberIdAndBookIdAndStatusIn(memberId, bookId, OPEN_STATUSES)) {
            throw new ConflictException("Độc giả đã có đặt trước đang chờ cho đầu sách này.");
        }
    }
}
