package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.domain.entity.LoanEntity;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.CirculationService;
import vn.lms.library.service.MemberService;
import vn.lms.library.web.BusinessException;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/circulation")
public class CirculationController {

    private final CirculationService circulationService;
    private final MemberService memberService;

    public CirculationController(CirculationService circulationService, MemberService memberService) {
        this.circulationService = circulationService;
        this.memberService = memberService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public LoanResponse checkout(@RequestBody CheckoutRequest request) {
        return LoanResponse.from(circulationService.checkout(request.memberId(), request.copyId()));
    }

    @PostMapping("/{loanId}/return")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public LoanResponse returnLoan(@PathVariable("loanId") UUID loanId) {
        return LoanResponse.from(circulationService.returnLoan(loanId));
    }

    @PostMapping("/{loanId}/renew")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','MEMBER')")
    public LoanResponse renew(
            @PathVariable("loanId") UUID loanId,
            @AuthenticationPrincipal UserPrincipal principal) {
        assertMemberOwnsLoanIfNeeded(loanId, principal);
        return LoanResponse.from(circulationService.renew(loanId));
    }

    private void assertMemberOwnsLoanIfNeeded(UUID loanId, UserPrincipal principal) {
        boolean isStaff = principal.getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    return "ROLE_ADMIN".equals(role) || "ROLE_LIBRARIAN".equals(role);
                });
        if (isStaff) {
            return;
        }
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        LoanEntity loan = circulationService.findLoan(loanId);
        if (!loan.getMember().getId().equals(memberId)) {
            throw new BusinessException("Không có quyền gia hạn phiếu mượn này.");
        }
    }

    public record CheckoutRequest(UUID memberId, UUID copyId) {
    }

    public record LoanResponse(
            UUID id,
            UUID memberId,
            UUID copyId,
            String status,
            Instant dueAt,
            int renewalCount) {
        static LoanResponse from(LoanEntity loan) {
            return new LoanResponse(
                    loan.getId(),
                    loan.getMember().getId(),
                    loan.getBookCopy().getId(),
                    loan.getStatus().name(),
                    loan.getDueAt(),
                    loan.getRenewalCount());
        }
    }
}
