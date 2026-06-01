package vn.lms.library.web.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.lms.library.service.BookCopyLookupService;
import vn.lms.library.service.MemberLookupService;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class CirculationLookupController {

    private final MemberLookupService memberLookupService;
    private final BookCopyLookupService bookCopyLookupService;

    public CirculationLookupController(
            MemberLookupService memberLookupService,
            BookCopyLookupService bookCopyLookupService) {
        this.memberLookupService = memberLookupService;
        this.bookCopyLookupService = bookCopyLookupService;
    }

    @GetMapping("/members/lookup")
    public MemberLookupService.MemberLookupResult lookupMember(@RequestParam("q") String q) {
        return memberLookupService.lookup(q);
    }

    @GetMapping("/book-copies/lookup")
    public BookCopyLookupService.BookCopyLookupResult lookupCopy(@RequestParam("copyCode") String copyCode) {
        return bookCopyLookupService.lookup(copyCode);
    }
}
