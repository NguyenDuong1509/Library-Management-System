package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.domain.entity.ReservationEntity;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.MemberService;
import vn.lms.library.service.ReservationService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final MemberService memberService;

    public ReservationController(ReservationService reservationService, MemberService memberService) {
        this.reservationService = reservationService;
        this.memberService = memberService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public List<ReservationResponse> listOpen() {
        return reservationService.listOpen().stream().map(ReservationResponse::from).toList();
    }

    @GetMapping("/book/{bookId}")
    public List<ReservationResponse> list(@PathVariable("bookId") UUID bookId) {
        return reservationService.listByBook(bookId).stream().map(ReservationResponse::from).toList();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<ReservationResponse> myReservations(@AuthenticationPrincipal UserPrincipal principal) {
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        return reservationService.listByMember(memberId).stream().map(ReservationResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ReservationResponse create(@RequestBody CreateReservationRequest request) {
        return ReservationResponse.from(reservationService.create(request.memberId(), request.bookId()));
    }

    @PostMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public ReservationResponse createMine(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateMyReservationRequest request) {
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        return ReservationResponse.from(reservationService.create(memberId, request.bookId()));
    }

    @PatchMapping("/{id}/cancel")
    public ReservationResponse cancel(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isStaff = principal.getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    return "ROLE_ADMIN".equals(role) || "ROLE_LIBRARIAN".equals(role);
                });
        UUID memberId = isStaff
                ? null
                : memberService.requireByUserId(principal.getId()).getId();
        return ReservationResponse.from(reservationService.cancel(id, memberId, isStaff));
    }

    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public FulfillResponse fulfill(
            @PathVariable("id") UUID id,
            @RequestBody FulfillRequest request) {
        ReservationService.FulfillResult result = reservationService.fulfill(id, request.copyId());
        return FulfillResponse.from(result);
    }

    public record FulfillRequest(UUID copyId) {
    }

    public record FulfillResponse(
            UUID reservationId,
            String reservationStatus,
            UUID loanId,
            String copyCode,
            String bookTitle) {
        static FulfillResponse from(ReservationService.FulfillResult result) {
            LoanEntity loan = result.loan();
            return new FulfillResponse(
                    result.reservation().getId(),
                    result.reservation().getStatus().name(),
                    loan.getId(),
                    loan.getBookCopy().getCopyCode(),
                    loan.getBookCopy().getBook().getTitle());
        }
    }

    public record CreateReservationRequest(UUID memberId, UUID bookId) {
    }

    public record CreateMyReservationRequest(UUID bookId) {
    }

    public record ReservationResponse(
            UUID id,
            UUID memberId,
            UUID bookId,
            String status,
            int queuePosition,
            String memberName,
            String libraryCardId,
            String bookTitle) {
        static ReservationResponse from(ReservationEntity r) {
            return new ReservationResponse(
                    r.getId(),
                    r.getMember().getId(),
                    r.getBook().getId(),
                    r.getStatus().name(),
                    r.getQueuePosition(),
                    r.getMember().getUser().getName(),
                    r.getMember().getLibraryCardId(),
                    r.getBook().getTitle());
        }
    }
}
