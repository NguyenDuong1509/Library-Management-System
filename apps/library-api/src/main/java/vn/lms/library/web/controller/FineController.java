package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.domain.entity.FineEntity;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.FineService;
import vn.lms.library.service.MemberService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fines")
public class FineController {

    private final FineService fineService;
    private final MemberService memberService;

    public FineController(FineService fineService, MemberService memberService) {
        this.fineService = fineService;
        this.memberService = memberService;
    }

    @GetMapping("/unpaid")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public List<FineResponse> listUnpaid() {
        return fineService.listUnpaid().stream().map(FineResponse::from).toList();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<FineResponse> myUnpaid(@AuthenticationPrincipal UserPrincipal principal) {
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        return fineService.listUnpaidForMember(memberId).stream().map(FineResponse::from).toList();
    }

    @PostMapping("/{fineId}/pay")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public FineResponse pay(@PathVariable("fineId") UUID fineId) {
        return FineResponse.from(fineService.markPaid(fineId));
    }

    public record FineResponse(UUID id, UUID loanId, int amount, String status) {
        static FineResponse from(FineEntity f) {
            return new FineResponse(f.getId(), f.getLoan().getId(), f.getAmount(), f.getStatus().name());
        }
    }
}
