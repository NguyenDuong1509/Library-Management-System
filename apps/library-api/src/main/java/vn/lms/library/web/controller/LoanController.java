package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.LoanQueryService;
import vn.lms.library.service.MemberService;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanQueryService loanQueryService;
    private final MemberService memberService;

    public LoanController(LoanQueryService loanQueryService, MemberService memberService) {
        this.loanQueryService = loanQueryService;
        this.memberService = memberService;
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public List<LoanQueryService.ActiveLoanResult> activeByMember(@RequestParam("memberId") UUID memberId) {
        return loanQueryService.listActiveByMember(memberId);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<LoanQueryService.ActiveLoanResult> myLoans(@AuthenticationPrincipal UserPrincipal principal) {
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        return loanQueryService.listActiveByMember(memberId);
    }

    @GetMapping("/me/history")
    @PreAuthorize("hasRole('MEMBER')")
    public PageResponse<LoanQueryService.HistoryLoanResult> myLoanHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        UUID memberId = memberService.requireByUserId(principal.getId()).getId();
        return loanQueryService.listHistoryByMember(memberId, PageRequest.of(page, size));
    }
}
