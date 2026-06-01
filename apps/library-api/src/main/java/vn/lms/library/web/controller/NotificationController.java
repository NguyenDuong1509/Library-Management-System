package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.security.UserPrincipal;
import vn.lms.library.service.MemberService;
import vn.lms.library.service.NotificationService;
import vn.lms.library.web.dto.PageRequest;
import vn.lms.library.web.dto.PageResponse;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final MemberService memberService;

    public NotificationController(NotificationService notificationService, MemberService memberService) {
        this.notificationService = notificationService;
        this.memberService = memberService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public PageResponse<NotificationService.NotificationView> myNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        var memberId = memberService.requireByUserId(principal.getId()).getId();
        return notificationService.listForMember(memberId, PageRequest.of(page, size));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public PageResponse<NotificationService.NotificationView> allNotifications(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return notificationService.listAll(PageRequest.of(page, size));
    }
}
